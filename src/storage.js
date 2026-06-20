// Storage adapter v6 - ROBUST: localStorage-first, Firestore sync
// RULE 1: Always save to localStorage FIRST (sync, instant, never fails)
// RULE 2: Then sync to Firestore in background (async, might fail)
// RULE 3: On load, use whichever has the actual data (a non-empty library
//         ALWAYS beats an empty one; timestamps only break ties).
//
// v6 changes (data-loss fixes):
//   (A) RECOVERY: if the new meta/books/wishes docs are empty, automatically
//       read the legacy single document "bookjournal-v4" and migrate it forward.
//   (B) GUARD: never overwrite an existing non-empty library with an empty one
//       (checked at the localStorage layer, the Firestore layer, AND on load).

import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const MAIN_KEY = "bookjournal-v4";
const TS_KEY = "bookjournal-v4-ts"; // timestamp of last local save

// ── HELPERS ──

function countBooks(jsonStr) {
  if (!jsonStr) return 0;
  try { return (JSON.parse(jsonStr).books || []).length; } catch { return 0; }
}

// ── FIRESTORE HELPERS ──

async function firestoreSave(uid, data) {
  const books = data.books || [];
  const wishes = data.wishes || [];

  // ──────────────────────────────────────────────────────────────
  // GUARD (B): never wipe an existing library with an empty save.
  // A brand-new user (nothing stored anywhere) is still allowed to
  // create empty docs; we only block empty-OVER-non-empty.
  // ──────────────────────────────────────────────────────────────
  if (books.length === 0) {
    try {
      const existing = await getDoc(doc(db, "users", uid, "data", "books"));
      const existingItems = existing.exists() ? (existing.data().items || []) : [];

      let legacyItems = [];
      if (existingItems.length === 0) {
        const legacy = await getDoc(doc(db, "users", uid, "data", MAIN_KEY));
        legacyItems = (legacy.exists() && Array.isArray(legacy.data().books))
          ? legacy.data().books : [];
      }

      if (existingItems.length > 0 || legacyItems.length > 0) {
        console.warn("[storage] Blocked an empty-library save to protect existing data.");
        return; // abort — do NOT overwrite real data with nothing
      }
    } catch (e) {
      // If we can't verify what's already there, stay safe and skip the empty write.
      console.warn("[storage] Could not verify existing data; skipping empty save to stay safe.");
      return;
    }
  }

  // Strip large base64 covers before saving to Firestore (1MB/doc limit).
  const cleanBooks = books.map(b => {
    if (b.coverUrl && b.coverUrl.startsWith("data:") && b.coverUrl.length > 100000) {
      return { ...b, coverUrl: "" };
    }
    return b;
  });
  const cleanWishes = wishes.map(w => {
    if (w.coverUrl && w.coverUrl.startsWith("data:") && w.coverUrl.length > 100000) {
      return { ...w, coverUrl: "" };
    }
    return w;
  });

  await Promise.all([
    setDoc(doc(db, "users", uid, "data", "meta"), { years: data.years || [], savedAt: Date.now() }),
    setDoc(doc(db, "users", uid, "data", "books"), { items: cleanBooks }),
    setDoc(doc(db, "users", uid, "data", "wishes"), { items: cleanWishes }),
  ]);

  // Update community profile
  updateCommunityProfile(uid, {
    booksCount: books.length,
    wishesCount: wishes.length,
    readCount: books.filter(b => b.status === "read").length,
    favoriteCount: books.filter(b => b.favorite).length,
    lastActive: new Date().toISOString(),
  }).catch(() => {});
}

async function firestoreLoad(uid) {
  const [metaSnap, booksSnap, wishesSnap] = await Promise.all([
    getDoc(doc(db, "users", uid, "data", "meta")),
    getDoc(doc(db, "users", uid, "data", "books")),
    getDoc(doc(db, "users", uid, "data", "wishes")),
  ]);

  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const books = booksSnap.exists() ? (booksSnap.data().items || []) : [];
  const wishes = wishesSnap.exists() ? (wishesSnap.data().items || []) : [];

  // Normal path: the new docs already hold the library.
  if (books.length > 0) {
    return { years: meta.years || [], books, wishes, _savedAt: meta.savedAt || 0 };
  }

  // ──────────────────────────────────────────────────────────────
  // RECOVERY (A): new docs are empty → fall back to the legacy single
  // document "bookjournal-v4" and migrate it forward into the new docs.
  // ──────────────────────────────────────────────────────────────
  try {
    const legacySnap = await getDoc(doc(db, "users", uid, "data", MAIN_KEY));
    if (legacySnap.exists()) {
      const legacy = legacySnap.data() || {};
      const legacyBooks = Array.isArray(legacy.books) ? legacy.books : [];
      const legacyWishes = Array.isArray(legacy.wishes) ? legacy.wishes : wishes;
      const legacyYears = Array.isArray(legacy.years) ? legacy.years : (meta.years || []);

      if (legacyBooks.length > 0 || legacyWishes.length > 0) {
        console.log("[storage] Recovered library from legacy '" + MAIN_KEY + "' document.");
        // Consolidate into the new docs (guarded; non-empty so it is allowed).
        // The legacy doc is never deleted, so it stays as an extra backup.
        firestoreSave(uid, { years: legacyYears, books: legacyBooks, wishes: legacyWishes })
          .catch(e => console.warn("[storage] Forward migration failed (legacy doc still intact):", e));
        return { years: legacyYears, books: legacyBooks, wishes: legacyWishes, _savedAt: Date.now() };
      }
    }
  } catch (e) {
    console.warn("[storage] Legacy recovery check failed:", e);
  }

  // Truly nothing anywhere yet.
  if (!metaSnap.exists() && !booksSnap.exists()) return null;
  return { years: meta.years || [], books, wishes, _savedAt: meta.savedAt || 0 };
}

// ── COMMUNITY ──

async function updateCommunityProfile(uid, stats = {}) {
  const user = auth.currentUser;
  if (!user) return;
  await setDoc(doc(db, "community", "profiles", "users", uid), {
    uid, name: user.displayName || "Leitora",
    email: user.email || "", photo: user.photoURL || "",
    ...stats,
  }, { merge: true });
}

async function registerInCommunityFn() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const existing = await getDoc(doc(db, "community", "profiles", "users", user.uid));
    if (!existing.exists()) {
      await updateCommunityProfile(user.uid, {
        booksCount: 0, wishesCount: 0, readCount: 0, favoriteCount: 0,
        lastActive: new Date().toISOString(),
      });
    } else {
      await updateCommunityProfile(user.uid, { lastActive: new Date().toISOString() });
    }
  } catch (e) { console.warn("Community registration failed:", e); }
}

// ── MAIN STORAGE ──

const storage = {
  async get(key, shared = false) {
    // SHARED (Book Club)
    if (shared) {
      try {
        const snap = await getDoc(doc(db, "bookclub", "state"));
        return snap.exists() ? { key, value: JSON.stringify(snap.data()), shared: true } : null;
      } catch (e) {
        console.error("Shared get error:", e);
        return null;
      }
    }

    // PERSONAL - localStorage-first strategy
    const uid = auth.currentUser?.uid;
    const localValue = localStorage.getItem(key);
    const localTs = parseInt(localStorage.getItem(TS_KEY) || "0");
    const localBooks = countBooks(localValue);

    if (!uid) {
      // Not logged in, use localStorage only
      return localValue ? { key, value: localValue, shared: false } : null;
    }

    // Try to load from Firestore
    try {
      const remote = await firestoreLoad(uid);
      if (remote) {
        const remoteTs = remote._savedAt || 0;
        delete remote._savedAt;
        const remoteBooks = (remote.books || []).length;

        // ──────────────────────────────────────────────────────────
        // GUARD (B) on load: a non-empty library ALWAYS wins over an
        // empty one, regardless of timestamps. Timestamps only decide
        // ties (both non-empty, or both empty).
        // ──────────────────────────────────────────────────────────
        let useLocal;
        if (remoteBooks > 0 && localBooks === 0) useLocal = false;
        else if (localBooks > 0 && remoteBooks === 0) useLocal = true;
        else useLocal = !!localValue && localTs > remoteTs;

        if (useLocal) {
          // Local wins - use local, sync to Firestore in background
          console.log("Local data wins, syncing to Firestore...");
          firestoreSave(uid, JSON.parse(localValue)).catch(e =>
            console.warn("Background sync failed:", e));
          return { key, value: localValue, shared: false };
        }

        // Remote wins - use remote, refresh local cache.
        // Merge: keep local covers that the cloud may have stripped.
        let outValue;
        if (localValue) {
          try {
            outValue = JSON.stringify(mergeCovers(remote, JSON.parse(localValue)));
          } catch (e) {
            outValue = JSON.stringify(remote);
          }
        } else {
          outValue = JSON.stringify(remote);
        }
        localStorage.setItem(key, outValue);
        localStorage.setItem(TS_KEY, String(remoteTs || Date.now()));
        return { key, value: outValue, shared: false };
      }
    } catch (e) {
      console.warn("Firestore load failed, using localStorage:", e);
    }

    // Firestore failed or empty - use localStorage
    if (localValue) {
      // Try to migrate local data to Firestore (guarded inside firestoreSave)
      firestoreSave(uid, JSON.parse(localValue)).catch(() => {});
      return { key, value: localValue, shared: false };
    }

    return null;
  },

  async set(key, value, shared = false) {
    // SHARED (Book Club)
    if (shared) {
      try {
        const data = typeof value === "string" ? JSON.parse(value) : value;
        await setDoc(doc(db, "bookclub", "state"), data);
        return { key, value, shared: true };
      } catch (e) {
        console.error("Shared set error:", e);
        return null;
      }
    }

    const strValue = typeof value === "string" ? value : JSON.stringify(value);

    // ──────────────────────────────────────────────────────────────
    // GUARD (B) at the local layer: don't let an empty library blow away
    // a cached non-empty one (this is the classic "app boots empty and
    // autosaves over real data" bug). New users (empty cache) pass through.
    // ──────────────────────────────────────────────────────────────
    if (countBooks(strValue) === 0) {
      const cached = localStorage.getItem(key);
      if (cached && countBooks(cached) > 0) {
        console.warn("[storage] Blocked empty-library save (local cache has books).");
        return { key, value: cached, shared: false };
      }
    }

    // ALWAYS save to localStorage FIRST
    const now = Date.now();
    try {
      localStorage.setItem(key, strValue);
      localStorage.setItem(TS_KEY, String(now));
    } catch (e) {
      console.error("localStorage save failed:", e);
    }

    // Then sync to Firestore in background (also guarded inside firestoreSave)
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const data = typeof value === "string" ? JSON.parse(value) : value;
        await firestoreSave(uid, data);
      } catch (e) {
        console.warn("Firestore sync failed (data safe in localStorage):", e);
      }
    }

    return { key, value: strValue, shared: false };
  },

  async delete(key, shared = false) {
    if (!shared) {
      localStorage.removeItem(key);
      localStorage.removeItem(TS_KEY);
    }
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    return { keys: [], prefix, shared };
  },

  async getCommunity() {
    try {
      const snap = await getDocs(collection(db, "community", "profiles", "users"));
      return snap.docs.map(d => d.data());
    } catch (e) {
      console.error("Failed to load community:", e);
      return [];
    }
  },

  async getUserData(otherUid) {
    try {
      const [metaSnap, booksSnap, wishesSnap] = await Promise.all([
        getDoc(doc(db, "users", otherUid, "data", "meta")),
        getDoc(doc(db, "users", otherUid, "data", "books")),
        getDoc(doc(db, "users", otherUid, "data", "wishes")),
      ]);
      return {
        years: metaSnap.exists() ? metaSnap.data().years || [] : [],
        books: booksSnap.exists() ? booksSnap.data().items || [] : [],
        wishes: wishesSnap.exists() ? wishesSnap.data().items || [] : [],
      };
    } catch (e) {
      console.error("Failed to load user data:", e);
      return null;
    }
  },

  async registerInCommunity() {
    return await registerInCommunityFn();
  },
};

// Merge: keep covers from local when remote stripped them
function mergeCovers(remote, local) {
  const localBookMap = {};
  (local.books || []).forEach(b => { if (b.id && b.coverUrl) localBookMap[b.id] = b.coverUrl; });

  const localWishMap = {};
  (local.wishes || []).forEach(w => { if (w.id && w.coverUrl) localWishMap[w.id] = w.coverUrl; });

  return {
    ...remote,
    books: (remote.books || []).map(b => ({
      ...b,
      coverUrl: b.coverUrl || localBookMap[b.id] || "",
    })),
    wishes: (remote.wishes || []).map(w => ({
      ...w,
      coverUrl: w.coverUrl || localWishMap[w.id] || "",
    })),
  };
}

window.storage = storage;
export default storage;
