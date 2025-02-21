// 📌 Import Firebase Modules
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 📌 Firebase Configuration (Loaded from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 📌 Initialize Firebase App (Avoid Duplicate Instances)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 📌 Firebase Services
export const auth = getAuth(app); // Authentication
export const googleProvider = new GoogleAuthProvider(); // Google Auth Provider
export const db = getFirestore(app); // Firestore Database
export const storage = getStorage(app); // Cloud Storage