import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwBdoIgPcdxaGKXaElyyF0LryL7yOmjzg",

  authDomain: "neonatal-jaundice-detect-34969.firebaseapp.com",

  projectId: "neonatal-jaundice-detect-34969",

  storageBucket: "neonatal-jaundice-detect-34969.firebasestorage.app",

  messagingSenderId: "628663898285",

  appId: "1:628663898285:web:2891268f46a2f6bcb93624",

  measurementId: "G-4BE0HX9P2E",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
