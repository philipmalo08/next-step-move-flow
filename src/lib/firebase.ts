import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmK9Q7L2nF8oP9wR7xE6vC5kH1jI3uY2s",
  authDomain: "nextmovement-demo.firebaseapp.com",
  projectId: "nextmovement-demo",
  storageBucket: "nextmovement-demo.appspot.com", 
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6789012",
  measurementId: "G-ABCD123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;