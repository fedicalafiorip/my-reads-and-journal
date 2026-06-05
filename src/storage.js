// Storage adapter v5 - ROBUST: localStorage-first, Firestore sync
// RULE 1: Always save to localStorage FIRST (sync, instant, never fails)
// RULE 2: Then sync to Firestore in background (async, might fail)
// RULE 3: On load, use whichever has newer data (localStorage vs Firestore)

import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const MAIN_KEY = "bookjournal-v4";
const TS_KEY = "bookjournal-v4-ts"; // timestamp of last local save

// ── FIRESTORE HELPERS ──

async function firestoreSave(uid, data) {
  const books = data.books || [];
  const wishes = data.wishes || [];

  // Strip large base64 covers before saving to Firestore
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

  if (!metaSnap.exists() && !booksSnap.exists()) return null;

  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const books = booksSnap.exists() ? booksSnap.data().items || [] : [];
  const wishes = wishesSnap.exists() ? wishesSnap.data().items || [] : [];
  const savedAt = meta.savedAt || 0;

  return { years: meta.years || [], books, wishes, _savedAt: savedAt };
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

        if (localValue && localTs > remoteTs) {
          // Local is newer - use local, sync to Firestore in background
          console.log("Local data is newer, syncing to Firestore...");
          firestoreSave(uid, JSON.parse(localValue)).catch(e =>
            console.warn("Background sync failed:", e));
          return { key, value: localValue, shared: false };
        }

        // Remote is newer or same - use remote, update local cache
        const value = JSON.stringify(remote);

        // Merge: keep local covers that remote might have stripped
        if (localValue) {
          try {
            const localData = JSON.parse(localValue);
            const merged = mergeCovers(remote, localData);
            const mergedValue = JSON.stringify(merged);
            localStorage.setItem(key, mergedValue);
            localStorage.setItem(TS_KEY, String(remoteTs || Date.now()));
            return { key, value: mergedValue, shared: false };
          } catch(e) {}
        }

        localStorage.setItem(key, value);
        localStorage.setItem(TS_KEY, String(remoteTs || Date.now()));
        return { key, value, shared: false };
      }
    } catch (e) {
      console.warn("Firestore load failed, using localStorage:", e);
    }

    // Firestore failed or empty - use localStorage
    if (localValue) {
      // Try to migrate local data to Firestore
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

    // PERSONAL - ALWAYS save to localStorage FIRST
    const strValue = typeof value === "string" ? value : JSON.stringify(value);
    const now = Date.now();
    try {
      localStorage.setItem(key, strValue);
      localStorage.setItem(TS_KEY, String(now));
    } catch (e) {
      console.error("localStorage save failed:", e);
    }

    // Then sync to Firestore in background
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const data = typeof value === "string" ? JSON.parse(value) : value;
        data._savedAt = now; // Add timestamp for comparison
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
