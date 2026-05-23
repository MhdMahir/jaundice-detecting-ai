import { auth, db } from "./firebase.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const form = document.getElementById("loginForm");
const identifierInput = document.getElementById("loginIdentifier");
const passwordInput = document.getElementById("password");
const message = document.getElementById("loginMessage");

function showMessage(text, type) {
  message.textContent = text;
  message.className = `form-error ${type} show`;
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function resolveLoginEmail(identifier) {
  if (isEmail(identifier)) {
    const email = identifier.toLowerCase();
    const emailQuery = query(
      collection(db, "users"),
      where("email", "==", email),
    );
    const emailSnapshot = await getDocs(emailQuery);

    return { email, exists: !emailSnapshot.empty };
  }

  const phoneDigits = normalizePhone(identifier);

  if (phoneDigits.length < 7) {
    return { error: "Enter a valid email or phone number" };
  }

  const phoneQuery = query(
    collection(db, "users"),
    where("phoneDigits", "==", phoneDigits),
  );
  const phoneSnapshot = await getDocs(phoneQuery);

  if (phoneSnapshot.empty) {
    return { exists: false };
  }

  const profile = phoneSnapshot.docs[0].data();

  if (!profile.email) {
    return { error: "This phone number is not linked to an email account" };
  }

  return { email: profile.email, exists: true };
}

async function loginUser() {
  const identifier = identifierInput.value.trim();
  const password = passwordInput.value;

  if (!identifier || !password) {
    showMessage("Enter your email or phone number and password.", "error");

    if (!identifier) {
      identifierInput.focus();
    } else {
      passwordInput.focus();
    }

    return;
  }

  try {
    const resolved = await resolveLoginEmail(identifier);

    if (resolved.error) {
      showMessage(resolved.error, "error");
      return;
    }

    if (!resolved.exists || !resolved.email) {
      showMessage("No account found. Please Sign Up", "error");
      return;
    }

    const credential = await signInWithEmailAndPassword(
      auth,
      resolved.email,
      password,
    );

    localStorage.setItem("userEmail", credential.user.email || resolved.email);
    if (!isEmail(identifier)) localStorage.setItem("userPhone", identifier);
    if (credential.user.displayName) {
      localStorage.setItem("userName", credential.user.displayName);
    }

    showMessage("Login successful", "success");

    setTimeout(() => {
      window.location = "/upload";
    }, 1000);
  } catch (error) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      showMessage("Incorrect password", "error");
    } else {
      showMessage("Login failed", "error");
    }
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  loginUser();
});

const provider = new GoogleAuthProvider();

document.getElementById("googleBtn")?.addEventListener("click", async () => {
  try {
    const credential = await signInWithPopup(auth, provider);

    if (credential.user.email) {
      localStorage.setItem("userEmail", credential.user.email);
    }
    if (credential.user.displayName) {
      localStorage.setItem("userName", credential.user.displayName);
    }

    window.location = "/upload";
  } catch {
    showMessage("Google login failed", "error");
  }
});
