// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCP3JgVbssQLy8I1RUie16WZWRVaDPBWl4",
  authDomain: "gen-lang-client-0638666313.firebaseapp.com",
  projectId: "gen-lang-client-0638666313",
  storageBucket: "gen-lang-client-0638666313.firebasestorage.app",
  messagingSenderId: "780145699077",
  appId: "1:780145699077:web:9f77f872617c9785fd6f6c",
  measurementId: "G-JTPCCDSGM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
