// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// You can get this from Firebase Console -> Project Settings -> General -> Your apps -> Web app
export const firebaseConfig = {
    apiKey: "AIzaSyBIQ5DvlR6NbpOdi5aLcyzsV99w8i85eu0",
    authDomain: "expense-tracker-cd47f.firebaseapp.com",
    projectId: "expense-tracker-cd47f",
    storageBucket: "expense-tracker-cd47f.firebasestorage.app",
    messagingSenderId: "601937191736",
    appId: "1:601937191736:android:fe0595e1af733fc60e17cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth (used to sync native sign‑in with Firestore)
export const auth = getAuth(app);
