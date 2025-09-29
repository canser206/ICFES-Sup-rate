// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKx96QxsgAuKAzqBQ41I1xta9v8FmOnls",
    authDomain: "icfes-superate.firebaseapp.com",
    projectId: "icfes-superate",
    storageBucket: "icfes-superate.firebasestorage.app",
    messagingSenderId: "122511015385",
    appId: "1:122511015385:web:70b5a32062dd96c58eedc8",
    measurementId: "G-C79587Z1LB"
    }

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
