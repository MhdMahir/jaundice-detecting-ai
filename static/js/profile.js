import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const form = document.getElementById("profileForm");
const status = document.getElementById("profileStatus");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const avatarInitials = document.getElementById("profileInitials");
const summaryName = document.getElementById("profileSummaryName");
const summaryEmail = document.getElementById("profileSummaryEmail");
const settingsForm = document.getElementById("settingsForm");
const settingsStatus = document.getElementById("settingsStatus");

const fields = {
  name: document.getElementById("profileName"),
  email: document.getElementById("profileEmail"),
  phone: document.getElementById("profilePhone"),
  role: document.getElementById("profileRole"),
  organization: document.getElementById("profileOrganization"),
};

const settingsFields = {
  rememberUpload: document.getElementById("rememberUpload"),
  resultHints: document.getElementById("resultHints"),
  emailUpdates: document.getElementById("emailUpdates"),
};

let currentUser = null;
let currentUserDocId = null;

function getStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function setStatus(element, text, type = "success") {
  if (!element) return;

  element.textContent = text;
  element.className = `auth-message ${type} show`;
}

function initialsFromName(name, email) {
  const source = name || email || "User";
  const parts = source.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function readFormProfile() {
  return {
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    phone: fields.phone.value.trim(),
    role: fields.role.value.trim(),
    organization: fields.organization.value.trim(),
  };
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function fillProfile(profile) {
  fields.name.value = profile.name || "";
  fields.email.value = profile.email || "";
  fields.phone.value = profile.phone || "";
  fields.role.value = profile.role || "";
  fields.organization.value = profile.organization || "";

  summaryName.textContent = profile.name || "Your profile";
  summaryEmail.textContent = profile.email || "Not signed in";
  avatarInitials.textContent = initialsFromName(profile.name, profile.email);
}

function readSettings() {
  return {
    rememberUpload: settingsFields.rememberUpload.checked,
    resultHints: settingsFields.resultHints.checked,
    emailUpdates: settingsFields.emailUpdates.checked,
  };
}

function fillSettings(settings) {
  settingsFields.rememberUpload.checked = settings.rememberUpload ?? true;
  settingsFields.resultHints.checked = settings.resultHints ?? true;
  settingsFields.emailUpdates.checked = settings.emailUpdates ?? false;
}

async function loadFirestoreProfile(user) {
  const usersQuery = query(collection(db, "users"), where("uid", "==", user.uid));
  const snapshot = await getDocs(usersQuery);

  if (snapshot.empty) {
    currentUserDocId = null;
    return {};
  }

  const userDoc = snapshot.docs[0];
  currentUserDocId = userDoc.id;
  return userDoc.data();
}

async function saveFirestoreProfile(profile) {
  if (!currentUser) return;

  const payload = {
    name: profile.name,
    email: currentUser.email || profile.email,
    phone: profile.phone,
    phoneDigits: normalizePhone(profile.phone),
    role: profile.role,
    organization: profile.organization,
    uid: currentUser.uid,
    updatedAt: new Date().toISOString(),
  };

  if (currentUserDocId) {
    await updateDoc(doc(db, "users", currentUserDocId), payload);
  } else {
    const created = await addDoc(collection(db, "users"), {
      ...payload,
      createdAt: new Date().toISOString(),
    });
    currentUserDocId = created.id;
  }
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  const storedProfile = getStoredJson("accountProfile", {});
  const storedSettings = getStoredJson("accountSettings", {});
  let profile = {
    ...storedProfile,
    name: storedProfile.name || localStorage.getItem("userName") || "",
    email: storedProfile.email || localStorage.getItem("userEmail") || "",
  };

  if (user) {
    profile = {
      ...profile,
      name: user.displayName || profile.name,
      email: user.email || profile.email,
    };

    try {
      const firestoreProfile = await loadFirestoreProfile(user);
      profile = { ...profile, ...firestoreProfile, email: user.email || profile.email };
    } catch {
      setStatus(status, "Profile loaded locally. Cloud sync is unavailable right now.", "error");
    }
  } else {
    setStatus(status, "Log in to sync these details with your account.", "error");
  }

  fillProfile(profile);
  fillSettings(storedSettings);
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const profile = readFormProfile();

  if (!profile.name) {
    setStatus(status, "Please enter your full name.", "error");
    fields.name.focus();
    return;
  }

  localStorage.setItem("accountProfile", JSON.stringify(profile));
  localStorage.setItem("userName", profile.name);
  if (profile.email) localStorage.setItem("userEmail", profile.email);
  if (profile.phone) localStorage.setItem("userPhone", profile.phone);

  try {
    if (currentUser) {
      await updateProfile(currentUser, { displayName: profile.name });
      await saveFirestoreProfile(profile);
    }

    fillProfile(profile);
    setStatus(status, "Profile saved successfully.", "success");
  } catch (error) {
    setStatus(status, error.message || "Could not save profile.", "error");
  }
});

settingsForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const settings = readSettings();
  localStorage.setItem("accountSettings", JSON.stringify(settings));

  if (!settings.rememberUpload) {
    localStorage.removeItem("uploadedImage");
    localStorage.removeItem("predictionResult");
  }

  setStatus(settingsStatus, "Settings saved.", "success");
});

resetPasswordBtn?.addEventListener("click", async () => {
  const email = fields.email.value.trim();

  if (!email) {
    setStatus(status, "Add your email address before resetting password.", "error");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    setStatus(status, "Password reset link sent.", "success");
  } catch (error) {
    setStatus(status, error.message || "Could not send reset link.", "error");
  }
});
