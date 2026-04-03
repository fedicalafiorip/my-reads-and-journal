// Storage adapter
// Personal data → localStorage
// Shared data (Book Club) → Firebase Firestore

import { getClubState, setClubState } from "./firebase";

const storage = {
  async get(key, shared = false) {
    if (shared) {
      try {
        const data = await getClubState();
        return data ? { key, value: JSON.stringify(data), shared: true } : null;
      } catch (e) {
        console.error("Firebase get error:", e);
        return null;
      }
    }
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared: false } : null;
    } catch (e) {
      return null;
    }
  },

  async set(key, value, shared = false) {
    if (shared) {
      try {
        const data = typeof value === "string" ? JSON.parse(value) : value;
        await setClubState(data);
        return { key, value, shared: true };
      } catch (e) {
        console.error("Firebase set error:", e);
        return null;
      }
    }
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (e) {
      return null;
    }
  },

  async delete(key, shared = false) {
    if (!shared) {
      localStorage.removeItem(key);
    }
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    if (!shared) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefix)) keys.push(k);
      }
      return { keys, prefix, shared: false };
    }
    return { keys: [], prefix, shared: true };
  }
};

// Make it available globally (same API as Claude artifacts)
window.storage = storage;

export default storage;
