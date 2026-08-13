// Firebase is intentionally optional. The pitch deck names Firebase as the
// dashboard's backing store/auth, but shipping a real Firebase project
// requires keys only the project owner has. This module keeps the app fully
// functional without them (a per-browser demo user id via localStorage) and
// documents the one place to swap in the real SDK later.
//
// To go live:
//   1. npm install firebase
//   2. Fill in VITE_FIREBASE_* in web/.env (see .env.example)
//   3. Replace getDemoUserId()'s callers with Firebase Auth's uid, e.g.
//      import { initializeApp } from "firebase/app";
//      import { getAuth, onAuthStateChanged } from "firebase/auth";
//      export const firebaseApp = initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, ... });
//      export const auth = getAuth(firebaseApp);

export const firebaseEnabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

const DEMO_USER_KEY = "zensleep.demoUserId";

export function getDemoUserId() {
  let id = localStorage.getItem(DEMO_USER_KEY);
  if (!id) {
    id = `demo-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(DEMO_USER_KEY, id);
  }
  return id;
}
