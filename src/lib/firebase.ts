import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUoxwgrrn3bWxlXzrHetNeTcz1WQxSoP4",
  authDomain: "nextmove2-2067b.firebaseapp.com",
  projectId: "nextmove2-2067b",
  storageBucket: "nextmove2-2067b.firebasestorage.app",
  messagingSenderId: "671666052484",
  appId: "1:671666052484:web:4e0417e4fb8bf7ad1311d1",
  measurementId: "G-G1E1QFKK0J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;