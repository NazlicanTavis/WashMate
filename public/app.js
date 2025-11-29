// app.js

// Firebase modülleri (CDN üzerinden)
// Sürüm: 10.12.5 (senin konsoldaki sürüm)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Senin Firebase config'in (CDN sekmesinden birebir kopya)
const firebaseConfig = {
  apiKey: "AIzaSyD8pcFbP4WANy68hDC1ohkM5DU_Rpx8EdA",
  authDomain: "washmate-227cf.firebaseapp.com",
  projectId: "washmate-227cf",
  storageBucket: "washmate-227cf.firebasestorage.app",
  messagingSenderId: "300306123506",
  appId: "1:300306123506:web:b27d5e492a900bbec59e6b",
  measurementId: "G-L4FKW04DPB"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elemanları
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const userEmailSpan = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const machinesTableBody = document.getElementById("machinesTableBody");

// REGISTER
registerBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const pass = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then(() => {
      alert("Registered!");
    })
    .catch((err) => {
      alert("Register error: " + err.message);
    });
});

// LOGIN
loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const pass = passwordInput.value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      alert("Logged in!");
    })
    .catch((err) => {
      alert("Login error: " + err.message);
    });
});

// AUTH STATE DEĞİŞİMİNİ DİNLE (login / logout kontrolü)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Kullanıcı login
    authSection.style.display = "none";
    dashboardSection.style.display = "block";
    userEmailSpan.textContent = user.email;
  } else {
    // Kullanıcı logout
    authSection.style.display = "block";
    dashboardSection.style.display = "none";
    userEmailSpan.textContent = "";
  }
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => alert("Logged out"))
    .catch((err) => alert("Logout error: " + err.message));
});

// MACHINES koleksiyonunu realtime dinle
const machinesRef = collection(db, "machines");

onSnapshot(machinesRef, (snapshot) => {
  machinesTableBody.innerHTML = ""; // tabloyu temizle

  snapshot.forEach((doc) => {
    const m = doc.data();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${m.name}</td>
      <td>${m.type}</td>
      <td>${m.status}</td>
    `;
    machinesTableBody.appendChild(row);
  });
});
