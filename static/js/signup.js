import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("formError");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("signupEmail");
const phoneInput = document.getElementById("signupPhone");
const passwordInput = document.getElementById("signupPassword");
const confirmInput = document.getElementById("confirmPassword");

function showMessage(text, type) {
  msg.textContent = text;
  msg.className = `form-error ${type}`;
  msg.classList.toggle("show", !!text);
}

function setError(id, message) {
  const el = document.getElementById(id);

  el.innerHTML = message;
  el.classList.toggle("show", !!message);
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function phoneIsValid(value) {
  const digits = normalizePhone(value);
  return digits.length >= 7 && digits.length <= 15;
}

async function phoneAlreadyExists(phoneDigits) {
  const phoneQuery = query(
    collection(db, "users"),
    where("phoneDigits", "==", phoneDigits),
  );
  const snapshot = await getDocs(phoneQuery);

  return !snapshot.empty;
}

async function createAccount() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  const phoneDigits = normalizePhone(phone);
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!name || !email || !phone || !password || !confirm) {
    showMessage("Please fill all fields", "error");
    return;
  }

  if (!phoneIsValid(phone)) {
    showMessage("Enter a valid phone number", "error");
    phoneInput.focus();
    return;
  }

  if (password !== confirm) {
    showMessage("Passwords do not match", "error");
    confirmInput.focus();
    return;
  }

  showMessage("", "");

  try {
    if (await phoneAlreadyExists(phoneDigits)) {
      showMessage("Phone number is already linked to an account", "error");
      phoneInput.focus();
      return;
    }

    const user = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(user.user, {
      displayName: name,
    });

    await addDoc(collection(db, "users"), {
      name,
      email,
      phone,
      phoneDigits,
      createdAt: new Date().toISOString(),
      uid: user.user.uid,
    });

    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem(
      "accountProfile",
      JSON.stringify({ name, email, phone }),
    );

    showMessage("Account created successfully", "success");

    setTimeout(() => {
      window.location = "/upload";
    }, 1200);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      showMessage("Account already exists", "error");
    } else {
      showMessage(error.message, "error");
    }
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  createAccount();
});

nameInput.addEventListener("blur", () => {
  if (nameInput.value.trim().length < 3) {
    setError("nameError", "Name must contain at least 3 letters");
  } else {
    setError("nameError", "");
  }
});

emailInput.addEventListener("blur", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(emailInput.value)) {
    setError("emailError", "Enter a valid email address");
  } else {
    setError("emailError", "");
  }
});

phoneInput.addEventListener("blur", () => {
  if (!phoneIsValid(phoneInput.value)) {
    setError("phoneError", "Enter a valid phone number");
  } else {
    setError("phoneError", "");
  }
});

passwordInput.addEventListener("blur", () => {
  const password = passwordInput.value;
  const missing = [];

  if (password.length < 8) missing.push("minimum 8 characters");
  if (!/[A-Z]/.test(password)) missing.push("1 uppercase letter");
  if (!/[a-z]/.test(password)) missing.push("1 lowercase letter");
  if (!/\d/.test(password)) missing.push("1 number");
  if (!/[@$!%*?&]/.test(password)) missing.push("1 special character");

  if (missing.length) {
    setError(
      "passwordError",
      `Password must contain:<br>• ${missing.join("<br>• ")}`,
    );
  } else {
    setError("passwordError", "");
  }
});

confirmInput.addEventListener("blur", () => {
  if (confirmInput.value !== passwordInput.value) {
    setError("confirmError", "Passwords do not match");
  } else {
    setError("confirmError", "");
  }
});
