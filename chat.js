import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

async function markChatRead(){

  const q = query(
    collection(db,"chats"),
    orderBy("time","desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  snap.forEach(doc=>{
    const d = doc.data();

    if(d.time){
      localStorage.setItem("lastChatTime", d.time.seconds);
    }
  });

}

markChatRead();
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

    const emojis = ["👍","👀","🙇","🔥","❗"];

    snap.forEach(docSnap => {

      const d = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "msg";

      let nameHTML = `<span class="name">${d.name}</span>`;

      if (d.system === true) {
        nameHTML = `<span class="name system">${d.name}</span>`;
      }

      div.innerHTML = `${nameHTML}：${d.message}`;

      /* ===== リアクション表示 ===== */

      const reactionBox = document.createElement("div");
      reactionBox.className = "reactions";

      const reactions = d.reactions || {};

      const myReaction = reactions[auth.currentUser?.uid];

      const counts = {};

      Object.values(reactions).forEach(r=>{
        counts[r] = (counts[r] || 0) + 1;
      });

      emojis.forEach(e=>{

        const btn = document.createElement("button");

        const count = counts[e] || 0;

        btn.textContent = e + " " + count;

        btn.className = "reactionBtn";

        if(myReaction === e){
          btn.classList.add("myReaction");
        }

        btn.onclick = ()=>{
          setReaction(id,e);
        };

        reactionBox.appendChild(btn);

      });

      div.appendChild(reactionBox);

      chatLog.appendChild(div);

    });

    chatLog.scrollTop = chatLog.scrollHeight;

  });

});

async function setReaction(docId, emoji){

  const user = auth.currentUser;

  if(!user) return;

  const ref = doc(db,"chats",docId);

  const field = "reactions." + user.uid;

  await updateDoc(ref,{
    [field]: emoji
  });

}