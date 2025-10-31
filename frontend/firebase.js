// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// our web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "fooddeliveryapp-e1da9.firebaseapp.com",
  projectId: "fooddeliveryapp-e1da9",
  storageBucket: "fooddeliveryapp-e1da9.firebasestorage.app",
  messagingSenderId: "945925864183",
  appId: "1:945925864183:web:5c0427b53097cba1e5b1f2",
  measurementId: "G-X1810H9P95"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app) // ye authentication ke liye hai getAuth function firebase se aata hai
export {app,auth}