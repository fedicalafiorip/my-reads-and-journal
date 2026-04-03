// Storage adapter v2
// ALL data syncs via Firebase Firestore
// Personal data → Firestore: users/{uid}/data/{key}
// Shared data (Book Club) → Firestore: bookclub/state

import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
      const snap = await getDoc(doc(db, "users", uid, "data", key));
      if (snap.exists()) {
        return { key, value: JSON.stringify(snap.data()), shared: false };
      }
      // Migration: move localStorage data to Firestore on first login
      const localValue = localStorage.getItem(key);
      if (localValue) {
        await setDoc(doc(db, "users", uid, "data", key), JSON.parse(localValue));
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
      const data = typeof value === "string" ? JSON.parse(value) : value;
      await setDoc(doc(db, "users", uid, "data", key), data);
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      return { key, value, shared: false };
    } catch (e) {
      console.error("Firebase personal set error:", e);
      try { localStorage.setItem(key, value); } catch (e2) {}
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
