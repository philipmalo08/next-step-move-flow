// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzIiYBbEbOlrOUBrS9Ut9VLA0LevadR6c",
  authDomain: "next-movement-app.firebaseapp.com",
  projectId: "next-movement-app",
  storageBucket: "next-movement-app.firebasestorage.app",
  messagingSenderId: "807691418610",
  appId: "1:807691418610:web:5faa8b9f46942b2448c96b",
  measurementId: "G-ZMRVQTD5C4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, analytics };