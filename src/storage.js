// Storage adapter v4 - with community features
// Personal data → Firestore: users/{uid}/data/{key}
// Shared data (Book Club) → Firestore: bookclub/state
// Community registry → Firestore: community/profiles/users/{uid}

import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const MAIN_KEY = "bookjournal-v4";

async function savePersonalData(uid, key, value) {
  const data = typeof value === "string" ? JSON.parse(value) : value;

  if (key === MAIN_KEY) {
    const meta = { years: data.years || [] };
    const books = data.books || [];
    const wishes = data.wishes || [];

    await Promise.all([
      setDoc(doc(db, "users", uid, "data", "meta"), meta),
      setDoc(doc(db, "users", uid, "data", "books"), { items: books }),
      setDoc(doc(db, "users", uid, "data", "wishes"), { items: wishes }),
    ]);

    // Update community profile with stats
    updateCommunityProfile(uid, {
      booksCount: books.length,
      wishesCount: wishes.length,
      readCount: books.filter(b => b.status === "read").length,
      favoriteCount: books.filter(b => b.favorite).length,
      lastActive: new Date().toISOString(),
    }).catch(e => console.warn("Community profile update failed:", e));
  } else {
    await setDoc(doc(db, "users", uid, "data", key), data);
  }
}

async function loadPersonalData(uid, key) {
  if (key === MAIN_KEY) {
    try {
      const [metaSnap, booksSnap, wishesSnap] = await Promise.all([
        getDoc(doc(db, "users", uid, "data", "meta")),
        getDoc(doc(db, "users", uid, "data", "books")),
        getDoc(doc(db, "users", uid, "data", "wishes")),
      ]);

      if (metaSnap.exists()) {
        const meta = metaSnap.data();
        const books = booksSnap.exists() ? booksSnap.data().items || [] : [];
        const wishes = wishesSnap.exists() ? wishesSnap.data().items || [] : [];
        return { years: meta.years || [], books, wishes };
      }
    } catch (e) {
      console.warn("Split load failed:", e);
    }

    try {
      const snap = await getDoc(doc(db, "users", uid, "data", key));
      if (snap.exists()) {
        const legacyData = snap.data();
        savePersonalData(uid, key, legacyData).catch(() => {});
        return legacyData;
      }
    } catch (e) {
      console.warn("Legacy load failed:", e);
    }
    return null;
  }

  const snap = await getDoc(doc(db, "users", uid, "data", key));
  return snap.exists() ? snap.data() : null;
}

async function updateCommunityProfile(uid, stats) {
  const user = auth.currentUser;
  if (!user) return;
  const profile = {
    uid,
    name: user.displayName || "Leitora",
    email: user.email || "",
    photo: user.photoURL || "",
    ...stats,
  };
  await setDoc(doc(db, "community", "profiles", "users", uid), profile, { merge: true });
}

async function getAllCommunityProfiles() {
  try {
    const snap = await getDocs(collection(db, "community", "profiles", "users"));
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.error("Failed to load community profiles:", e);
    return [];
  }
}

async function loadOtherUserData(otherUid) {
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
    console.error("Failed to load other user data:", e);
    return null;
  }
}

const storage = {
  async get(key, shared = false) {
    if (shared) {
      try {
        const snap = await getDoc(doc(db, "bookclub", "state"));
        return snap.exists() ? { key, value: JSON.stringify(snap.data()), shared: true } : null;
      } catch (e) {
        console.error("Firebase shared get error:", e);
        return null;
      }
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      try {
        const value = localStorage.getItem(key);
        return value ? { key, value, shared: false } : null;
      } catch (e) { return null; }
    }
    try {
      const data = await loadPersonalData(uid, key);
      if (data) {
        const value = JSON.stringify(data);
        localStorage.setItem(key, value);
        return { key, value, shared: false };
      }
      const localValue = localStorage.getItem(key);
      if (localValue) {
        const parsed = JSON.parse(localValue);
        await savePersonalData(uid, key, parsed).catch(() => {});
        return { key, value: localValue, shared: false };
      }
      return null;
    } catch (e) {
      console.error("Firebase personal get error:", e);
      try {
        const value = localStorage.getItem(key);
        return value ? { key, value, shared: false } : null;
      } catch (e2) { return null; }
    }
  },

  async set(key, value, shared = false) {
    if (shared) {
      try {
        const data = typeof value === "string" ? JSON.parse(value) : value;
        await setDoc(doc(db, "bookclub", "state"), data);
        return { key, value, shared: true };
      } catch (e) {
        console.error("Firebase shared set error:", e);
        return null;
      }
    }
    const uid = auth.currentUser?.uid;
    if (!uid) {
      try { localStorage.setItem(key, value); return { key, value, shared: false }; }
      catch (e) { return null; }
    }
    try {
      await savePersonalData(uid, key, value);
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      return { key, value, shared: false };
    } catch (e) {
      console.error("Firebase personal set error:", e);
      try { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); } catch (e2) {}
      return null;
    }
  },

  async delete(key, shared = false) {
    if (!shared) localStorage.removeItem(key);
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    return { keys: [], prefix, shared };
  },

  // Community methods
  async getCommunity() {
    return await getAllCommunityProfiles();
  },

  async getUserData(otherUid) {
    return await loadOtherUserData(otherUid);
  },
};

window.storage = storage;
export default storage;
