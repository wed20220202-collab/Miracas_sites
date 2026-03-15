import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let emojis = []; // Firestore から取得した画像を格納

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

    const emojis = [
      "https://example.com/emoji/thumbs_up.png",
      "https://example.com/emoji/eyes.png",
      "https://example.com/emoji/bow.png",
      "https://example.com/emoji/fire.png",
      "https://example.com/emoji/exclamation.png"
    ];

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

      emojis.forEach(imgUrl => {
        const btn = document.createElement("button");
        btn.className = "reactionBtn";

        // カウントは別に持つ
        const count = counts[imgUrl] || 0;

        // 画像を作成
        const img = document.createElement("img");
        img.src = imgUrl;
        img.style.width = "24px";  // 好きなサイズに調整
        img.style.height = "24px";
        img.style.verticalAlign = "middle";

        btn.appendChild(img);

        // カウント表示
        const span = document.createElement("span");
        span.textContent = " " + count;
        btn.appendChild(span);

        if(myReaction === imgUrl){
          btn.classList.add("myReaction");
        }

        btn.onclick = ()=>{
          setReaction(id,imgUrl);
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

async function loadReactionImages() {
  const ref = doc(db, "settings", "chatReactions");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    emojis = snap.data().images || [];
  } else {
    // Firestore に設定がなければデフォルト
    emojis = [
      "icons/emoji/thumbs_up.svg",
      "icons/emoji/eyes.svg",
      "icons/emoji/bow.svg",
      "icons/emoji/fire.svg",
      "icons/emoji/exclamation.svg"
    ];
  }
}

window.addEventListener("DOMContentLoaded", async () => {

  await loadReactionImages(); // まず画像を取得してから onSnapshot

  const chatLog = document.getElementById("chatLog");
  if (!chatLog) return;

  const q = query(
    collection(db, "chats"),
    orderBy("time")
  );

  onSnapshot(q, (snap) => {

    chatLog.innerHTML = "";

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

      emojis.forEach(imgUrl => {
        const btn = document.createElement("button");
        btn.className = "reactionBtn";

        const count = counts[imgUrl] || 0;

        const img = document.createElement("img");
        img.src = imgUrl;
        img.style.width = "24px";
        img.style.height = "24px";
        img.style.verticalAlign = "middle";

        btn.appendChild(img);

        const span = document.createElement("span");
        span.textContent = " " + count;
        btn.appendChild(span);

        if(myReaction === imgUrl){
          btn.classList.add("myReaction");
        }

        btn.onclick = ()=>{
          setReaction(id,imgUrl);
        };

        reactionBox.appendChild(btn);
      });

      div.appendChild(reactionBox);
      chatLog.appendChild(div);
    });

    chatLog.scrollTop = chatLog.scrollHeight;
  });

});