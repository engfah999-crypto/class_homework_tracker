import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// รหัสกุญแจของคุณที่ส่งมา
const firebaseConfig = {
  apiKey: "AIzaSyBoCmACEsEY_oycLYet9G3UGrNql25QBnE",
  authDomain: "class-homework-tracker-db.firebaseapp.com",
  databaseURL: "https://class-homework-tracker-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "class-homework-tracker-db",
  storageBucket: "class-homework-tracker-db.firebasestorage.app",
  messagingSenderId: "1042244890308",
  appId: "1:1042244890308:web:d4abc3156e263c80846391",
  measurementId: "G-G0FFDTYMVE"
};

// ป้องกันการ Initialze ซ้ำใน Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };