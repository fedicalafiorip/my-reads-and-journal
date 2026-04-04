// Storage adapter v3
// Splits book data across multiple Firestore documents to avoid 1MB limit
// Personal data → Firestore: users/{uid}/data/{key}
// Shared data (Book Club) → Firestore: bookclub/state

import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const MAIN_KEY = "bookjournal-v4";

// Split large data into separate Firestore docs
async function savePersonalData(uid, key, value) {
  const data = typeof value === "string" ? JSON.parse(value) : value;

  if (key === MAIN_KEY) {
    // Split into separate docs: meta, books, wishes
    const meta = { years: data.years || [] };
    const books = data.books || [];
    const wishes = data.wishes || [];

    // Save in parallel
    await Promise.all([
      setDoc(doc(db, "users", uid, "data", "meta"), meta),
      setDoc(doc(db, "users", uid, "data", "books"), { items: books }),
      setDoc(doc(db, "users", uid, "data", "wishes"), { items: wishes }),
    ]);
  } else {
    await setDoc(doc(db, "users", uid, "data", key), data);
  }
}

async function loadPersonalData(uid, key) {
  if (key === MAIN_KEY) {
    // Try new split format first
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
      console.warn("Split load failed, trying legacy:", e);
    }

    // Fallback: try legacy single-doc format
    try {
      const snap = await getDoc(doc(db, "users", uid, "data", key));
      if (snap.exists()) {
        const legacyData = snap.data();
        // Migrate to split format in background
        savePersonalData(uid, key, legacyData).catch(() => {});
        return legacyData;
      }
    } catch (e) {
      console.warn("Legacy load also failed:", e);
    }

    return null;
  }

  const snap = await getDoc(doc(db, "users", uid, "data", key));
  return snap.exists() ? snap.data() : null;
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
        localStorage.setItem(key, value); // cache locally
        return { key, value, shared: false };
      }
      // Migration: check localStorage for existing data
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
      // Fallback: save locally
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
  }
};

window.storage = storage;
export default storage;
