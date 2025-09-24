import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABZw1Jk2WdOFqmp2ww8lYV0DBdcVR50GI",
  authDomain: "hardwareinventory-65123.firebaseapp.com",
  projectId: "hardwareinventory-65123",
  storageBucket: "hardwareinventory-65123.firebasestorage.app",
  messagingSenderId: "1006715726520",
  appId: "1:1006715726520:web:13897a36fb527e8194224d",
  measurementId: "G-Y4ZHE3GBN5"
};

let app;
let auth;
let db;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
  console.log('Firebase Authentication initialized');
  
  // Initialize Firestore
  db = getFirestore(app);
  console.log('Firestore initialized');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase services');
}

export { auth, db };
export default app;
