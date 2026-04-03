import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDZOMsUwRuaaCX-34ZzLbuDwMF3dH_EWlc",
  authDomain: "my-reads-and-journal.firebaseapp.com",
  projectId: "my-reads-and-journal",
  storageBucket: "my-reads-and-journal.firebasestorage.app",
  messagingSenderId: "893014191108",
  appId: "1:893014191108:web:bf20305a467f12dcb79951"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Auth helpers
export const signInGoogle = () => signInWithPopup(auth, googleProvider);
export const signInAnon = () => signInAnonymously(auth);

// Firestore helpers for Book Club
const CLUB_DOC = "bookclub/state";

export const getClubState = async () => {
  const snap = await getDoc(doc(db, "bookclub", "state"));
  return snap.exists() ? snap.data() : null;
};

export const setClubState = async (data) => {
  await setDoc(doc(db, "bookclub", "state"), data);
};

export const onClubStateChange = (callback) => {
  return onSnapshot(doc(db, "bookclub", "state"), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
};

export { onAuthStateChanged };
