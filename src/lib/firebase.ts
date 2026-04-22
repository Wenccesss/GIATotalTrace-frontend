import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCwsQ14lHZcV0LyP2W1SJapiA8Eo71vDOc",
  authDomain: "ecotrace-d35d9.firebaseapp.com",
  projectId: "ecotrace-d35d9",
  storageBucket: "ecotrace-d35d9.firebasestorage.app",
  messagingSenderId: "165822620763",
  appId: "1:165822620763:web:38c3ccbb69ff1e41dd4b7e"
};



const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);