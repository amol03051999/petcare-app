// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBzFAQGxX63FJsS5jAYGJM5xAybtddJNDQ",
  authDomain: "petapp-751c5.firebaseapp.com",
  projectId: "petapp-751c5",
  storageBucket: "petapp-751c5.firebasestorage.app",
  messagingSenderId: "185829692971",
  appId: "1:185829692971:web:2d1853fd7a95f4dfffbc6e",
  measurementId: "G-EHD1DQ477G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login form handling
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm["email"].value;
    const password = loginForm["password"].value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      })
      .catch((err) => alert(err.message));
  });
}

// Signup form handling
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Account created! You can now log in.");
        window.location.href = "login.html";
      })
      .catch((err) => alert(err.message));
  });
}

// Modal signup from index.html
const signupLink = document.getElementById("signup-link");
if (signupLink) {
  signupLink.addEventListener("click", () => {
    const email = prompt("Enter your email:");
    const password = prompt("Choose a password:");
    if (!email || !password) return;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Account created! You can now log in.");
      })
      .catch((err) => alert(err.message));
  });
}