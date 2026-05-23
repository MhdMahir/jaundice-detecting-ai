import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const form = document.getElementById("contactForm");

const status = document.getElementById("contactStatus");

function showStatus(text) {
  status.textContent = text;

  status.classList.add("show");

  setTimeout(() => {
    status.classList.remove("show");

    setTimeout(() => {
      status.textContent = "";
    }, 350);
  }, 4000);
}

form.addEventListener(
  "submit",

  async (e) => {
    e.preventDefault();

    const email = document.getElementById("contactEmail").value.trim();

    const message = document.getElementById("contactMessage").value.trim();

    if (!email || !message) {
      showStatus("Please fill all fields");

      return;
    }

    try {
      await addDoc(
        collection(db, "contactMessages"),

        {
          email,
          message,
          createdAt: serverTimestamp(),
        },
      );

      showStatus("Message sent successfully");
      form.reset();
      setTimeout(() => {
        status.textContent = "";

        status.classList.remove("show");
      }, 3000);
    } catch (error) {
      console.log(error);

      showStatus("Unable to send message");
    }
  },
);
