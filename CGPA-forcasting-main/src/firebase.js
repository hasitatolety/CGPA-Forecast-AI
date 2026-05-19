import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";

// Real Firebase configuration for project: cgpa-fce08
const firebaseConfig = {
  apiKey: "AIzaSyAZkxL0NbMQ4P3zA-Lrb3XZ36I3Dw4Cbkg",
  authDomain: "cgpa-fce08.firebaseapp.com",
  projectId: "cgpa-fce08",
  storageBucket: "cgpa-fce08.firebasestorage.app",
  messagingSenderId: "408644276348",
  appId: "1:408644276348:web:9b4b2f11b47d5b4bd239f9",
  measurementId: "G-4KZPE9LE77"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper Services
export const firebaseService = {
  // auth
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  subscribeAuth: (cb) => onAuthStateChanged(auth, cb),

  // firestore - Profile Data
  saveSemesterHistory: async (userId, semesterData) => {
    const docRef = doc(db, "users", userId, "history", `sem_${semesterData.semester_no}`);
    await setDoc(docRef, semesterData);
  },

  getSemesterHistory: async (userId) => {
    const q = query(collection(db, "users", userId, "history"));
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => history.push(doc.data()));
    return history.sort((a, b) => a.semester_no - b.semester_no);
  },

  // firestore - Predictions persistence
  savePrediction: async (userId, predictionData) => {
    // We store the prediction to persist it
    const docRef = doc(db, "users", userId, "predictions", "next_semester");
    await setDoc(docRef, {
        ...predictionData,
        timestamp: new Date().toISOString()
    });
  },

  getStoredPrediction: async (userId) => {
    const docRef = doc(db, "users", userId, "predictions", "next_semester");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
  },

  // Save/Get current enrolling subjects (Target Subjects)
  saveTargetSubjects: async (userId, subjects) => {
    const docRef = doc(db, "users", userId, "config", "current_subjects");
    await setDoc(docRef, { subjects });
  },

  getTargetSubjects: async (userId) => {
    const docRef = doc(db, "users", userId, "config", "current_subjects");
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().subjects : [];
  }
};
