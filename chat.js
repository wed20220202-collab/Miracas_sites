import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* =============================
   グローバル
============================= */
let emojis = [];
let currentUser = localStorage.getItem("chatUser") || "未選択";

/* =============================
   既読管理
============================= */
async function markChatRead(){
  const q = query(
    collection(db,"chats"),
    orderBy("time","desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap=>{
    const d = docSnap.data();
    if(d.time){
      localStorage.setItem("lastChatTime", d.time.seconds);
    }
  });
}

/* =============================
   リアクション画像取得
============================= */
async function loadReactionImages() {
  const ref = doc(db, "settings", "chatReactions");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    emojis = snap.data().images || [];
  } else {
    emojis = [
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f44d.png",
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f440.png",
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f647.png",
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f525.png",
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2757.png"
    ];
  }
}

/* =============================
   リアクション送信
============================= */
async function setReaction(docId, emoji){
  const user = auth.currentUser;
  if(!user) return;

  const ref = doc(db,"chats",docId);
  const field = "reactions." + user.uid;

  await updateDoc(ref,{
    [field]: emoji
  });
}

/* =============================
   メイン処理（ここ1つに統一）
============================= */
window.addEventListener("DOMContentLoaded", async () => {

  await loadReactionImages();
  await markChatRead();

  const scrollBtn = document.getElementById("scrollBottomBtn");
  const sendBtn = document.getElementById("sendBtn");
  const message = document.getElementById("message");
  const chatLog = document.getElementById("chatLog");
  const stampArea = document.getElementById("stampArea");

  scrollBtn.addEventListener("click", () => {
    chatLog.scrollTo({
      top: chatLog.scrollHeight,
      behavior: "smooth"
    });
  });
  
  const userButtons = document.querySelectorAll("#userButtons button");
  const currentUserSpan = document.getElementById("currentUser");
  const customInput = document.getElementById("customName");
  const setCustomBtn = document.getElementById("setCustom");

  if (!chatLog) return;

  /* 初期表示 */
  currentUserSpan.textContent = currentUser;

  userButtons.forEach(btn => {
    if (btn.dataset.name === currentUser) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      userButtons.forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      currentUser = btn.dataset.name;
      currentUserSpan.textContent = currentUser;

      localStorage.setItem("chatUser", currentUser);
    });
  });

  /* カスタム名 */
  setCustomBtn?.addEventListener("click", () => {
    const value = customInput.value.trim();
    if (!value) return;

    userButtons.forEach(b => b.classList.remove("active"));

    currentUser = value;
    currentUserSpan.textContent = currentUser;

    localStorage.setItem("chatUser", currentUser);
    customInput.value = "";
  });

  chatLog.addEventListener("scroll", () => {

    const isNearBottom =
      chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 50;

    if(isNearBottom){
      scrollBtn.style.display = "none";
    }else{
      scrollBtn.style.display = "block";
    }

  });

  /* テキスト送信 */
  sendBtn?.addEventListener("click", async () => {

    const text = message.value.trim();
    if (!text) return;

    if (currentUser === "未選択") {
      alert("担当場所を選択してください");
      return;
    }

    const user = auth.currentUser;

    await addDoc(collection(db, "chats"), {
      name: currentUser,
      message: text,
      time: serverTimestamp()
    });

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
        console.log("ログ保存失敗:", e);
      }
    }

    message.value = "";
  });

  /* Enter送信 */
  message?.addEventListener("keypress", (e)=>{
    if(e.key === "Enter"){
      sendBtn.click();
    }
  });

  /* スタンプ送信 */
  stampArea?.addEventListener("click", async (e) => {

    if(e.target.tagName !== "IMG") return;

    if(currentUser === "未選択"){
      alert("担当場所を選択してください");
      return;
    }

    const stampSrc = e.target.getAttribute("src");

    await addDoc(collection(db, "chats"), {
      name: currentUser,
      message: `<img src="${stampSrc}" class="chat-stamp">`,
      isStamp: true,
      time: serverTimestamp()
    });
  });

  /* =============================
     リアルタイム受信（1つだけ！）
  ============================= */
  const q = query(collection(db, "chats"), orderBy("time"));

  onSnapshot(q, (snap) => {

    // 📌 現在のスクロール位置を保存
    const isNearBottom =
      chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 50;

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

      if (!d.isStamp) {
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

          const img = document.createElement("img");
          img.src = imgUrl;
          img.style.width = "20px";
          img.style.height = "20px";

          const span = document.createElement("span");
          span.textContent = counts[imgUrl] || 0;

          btn.appendChild(img);
          btn.appendChild(span);

          if (myReaction === imgUrl) {
            btn.classList.add("myReaction");
          }

          btn.onclick = () => setReaction(id, imgUrl);

          reactionBox.appendChild(btn);
        });

        div.appendChild(reactionBox);
      }

      chatLog.appendChild(div);
    });

    // 📌 下にいるときだけスクロール
    if (isNearBottom) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }

    if (!isNearBottom) {
      scrollBtn.style.display = "block";
    }

  });

});