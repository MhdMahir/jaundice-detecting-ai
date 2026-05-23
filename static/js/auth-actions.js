import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

function clearStoredAccount() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("accountProfile");
  localStorage.removeItem("accountSettings");
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.setLoggedInUI?.(false);
    return;
  }

  if (user.email) localStorage.setItem("userEmail", user.email);
  if (user.displayName) localStorage.setItem("userName", user.displayName);
  window.setLoggedInUI?.(true);
});

window.firebaseSignOut = async function firebaseSignOut() {
  try {
    await signOut(auth);
  } finally {
    clearStoredAccount();
    window.location.href = "/login";
  }
};
