import { auth } from "./firebase.js";

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const form = document.getElementById("forgotForm");

const email = document.getElementById("resetEmail");

const status = document.getElementById("forgotStatus");

function showStatus(text) {
  status.textContent = text;

  status.classList.add("show");

  setTimeout(() => {
    status.classList.remove("show");

    setTimeout(() => {
      status.textContent = "";
    }, 300);
  }, 2000);
}

form.addEventListener(
  "submit",

  async (e) => {
    e.preventDefault();

    const value = email.value.trim();

    if (!value) {
      showStatus("Please enter email");

      return;
    }

    try {
      await sendPasswordResetEmail(auth, value);

      showStatus("Password reset link sent");

      form.reset();

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.log(error);

      showStatus(error.message);
    }
  },
);
