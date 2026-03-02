import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

window.addEventListener("DOMContentLoaded", () => {

  const sendBtn = document.getElementById("sendBtn");
  const message = document.getElementById("message");
  const chatLog = document.getElementById("chatLog");

  const userButtons = document.querySelectorAll("#userButtons button");
  const currentUserSpan = document.getElementById("currentUser");
  const customInput = document.getElementById("customName");
  const setCustomBtn = document.getElementById("setCustom");

  if (!chatLog) return;

  let currentUser = localStorage.getItem("chatUser") || "未選択";

  /* =============================
     初期表示
  ============================= */
  currentUserSpan.textContent = currentUser;

  userButtons.forEach(btn => {
    if (btn.dataset.name === currentUser) {
      btn.classList.add("active");
    }
  });

  /* =============================
     担当場所ボタン
  ============================= */
  userButtons.forEach(btn => {
    btn.addEventListener("click", () => {

      userButtons.forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      currentUser = btn.dataset.name;
      currentUserSpan.textContent = currentUser;

      localStorage.setItem("chatUser", currentUser);
    });
  });

  /* =============================
     その他設定
  ============================= */
  setCustomBtn?.addEventListener("click", () => {

    const value = customInput.value.trim();
    if (!value) return;

    userButtons.forEach(b => b.classList.remove("active"));

    currentUser = value;
    currentUserSpan.textContent = currentUser;

    localStorage.setItem("chatUser", currentUser);

    customInput.value = "";
  });

  /* =============================
     メッセージ送信
  ============================= */
  sendBtn?.addEventListener("click", async () => {

    const text = message.value.trim();
    if (!text) return;

    if (currentUser === "未選択") {
      alert("担当場所を選択してください");
      return;
    }

    const user = auth.currentUser;

    /* 🔵 通常チャット保存 */
    await addDoc(collection(db, "chats"), {
      name: currentUser,
      message: text,
      time: serverTimestamp()
    });

    /* 🔥 送信ログ保存 */
    if (user) {
      try {
        await addDoc(collection(db, "loginLogs"), {
          action: "chat_send",
          email: user.email,
          uid: user.uid,
          displayName: user.displayName || null,
          message: text,
          page: "chat.html",
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.log("チャット送信ログ失敗:", e);
      }
    }

    message.value = "";
  });

  /* =============================
     Enter送信
  ============================= */
  message?.addEventListener("keypress", (e)=>{
    if(e.key === "Enter"){
      sendBtn.click();
    }
  });

  /* =============================
     リアルタイム受信
  ============================= */
  const q = query(
    collection(db, "chats"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {

    chatLog.innerHTML = "";

    snap.forEach(doc => {

      const d = doc.data();

      const div = document.createElement("div");
      div.className = "msg";

      div.innerHTML =
        `<span class="name">${d.name}</span>：${d.message}`;

      chatLog.appendChild(div);
    });

    chatLog.scrollTop = chatLog.scrollHeight;
  });

});