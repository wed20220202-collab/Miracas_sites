import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIQhHuF3we247IxmhrO3j-Gmr5RFYf-q4",
  authDomain: "chat-sites.firebaseapp.com",
  databaseURL: "https://chat-sites-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-sites",
  storageBucket: "chat-sites.firebasestorage.app",
  messagingSenderId: "36894057874",
  appId: "1:36894057874:web:2ae9634f2b1d1081a90d4b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
