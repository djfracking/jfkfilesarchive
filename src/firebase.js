// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDR6SfFCMPvXgA1KsGqyFPIWsGU1xw0vMA",
  authDomain: "chatjfkfiles.firebaseapp.com",
  projectId: "chatjfkfiles",
  storageBucket: "chatjfkfiles.firebasestorage.app",
  messagingSenderId: "112030570418",
  appId: "1:112030570418:web:26ea39a8380052a17536ab",
  measurementId: "G-M4XSR0LF3J",
  databaseURL: "https://chatjfkfiles-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  app,
  analytics,
  database,
  db,
  storage,
  functions
};
