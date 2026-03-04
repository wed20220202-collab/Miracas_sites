import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/* =========================
   管理者チェック
========================= */

const adminEmails = [
    "vga29-pc250033@sankogakuen.jp",
    "vga29-pc250006@sankogakuen.jp",
    "vga29-pc250029@sankogakuen.jp",
    "12210295@sankogakuen.jp",
    "12010311@sankogakuen.jp"
];

onAuthStateChanged(auth, (user)=>{
    if(!user || !adminEmails.includes(user.email)){
        location.href="404.html";
    }
});

/* =========================
   DOM読み込み後に全部実行
========================= */

window.addEventListener("DOMContentLoaded", async () => {

  const saveBtn = document.getElementById("saveTimeBtn");
  const startInput = document.getElementById("startHour");
  const endInput = document.getElementById("endHour");
  const deleteBtn = document.getElementById("deleteChatBtn");
  const resetBtn  = document.getElementById("resetArrangementBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const docRef = doc(db,"settings","timeConfig");

  /* ===== 利用時間読込 ===== */
  const snap = await getDoc(docRef);
  if(snap.exists()){
      const data = snap.data();
      startInput.value = data.startHour;
      endInput.value   = data.endHour;
  }

  /* ===== 利用時間保存 ===== */
  saveBtn.addEventListener("click", async ()=>{
      await setDoc(docRef,{
          startHour: Number(startInput.value),
          endHour:   Number(endInput.value)
      });
      alert("保存しました");
  });

  /* ===== チャット全削除 ===== */
  deleteBtn.addEventListener("click", async ()=>{
      if(!confirm("本当に削除しますか？")) return;

      const snap = await getDocs(collection(db,"chats"));
      for(const d of snap.docs){
          await deleteDoc(d.ref);
      }
      alert("削除完了");
  });

  /* ===== 配置図リセット ===== */
  resetBtn.addEventListener("click", async ()=>{
      if(!confirm("本当にリセットしますか？")) return;

      const arrRef = doc(db,"arrangements","current");
      const arrSnap = await getDoc(arrRef);

      if(!arrSnap.exists()){
          alert("データが存在しません");
          return;
      }

      const data = arrSnap.data();
      const newMembers = {};

      for(const name in data.members){
          newMembers[name] = "waiting";
      }

      await setDoc(arrRef,{ members:newMembers });
      alert("全員リセットしました");
  });

  /* ===== ログ表示 ===== */
  await loadLoginLogs();

  /* ===== ログアウト ===== */
  logoutBtn.addEventListener("click",()=>{
      signOut(auth);
  });

});

/* =========================
   ログ読み込み関数
========================= */

async function loadLoginLogs(){

    const logList = document.getElementById("logList");

    const q = query(
        collection(db,"loginLogs"),
        orderBy("timestamp","desc")
    );

    const snapshot = await getDocs(q);

    logList.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const div = document.createElement("div");
        div.className = "log-item";

        const date = data.timestamp
          ? data.timestamp.toDate().toLocaleString()
          : "取得中";

    div.innerHTML = `
      <strong>日時:</strong> ${date}<br>
      <strong>アクション:</strong> ${data.action || "login"}<br>
      <strong>Email:</strong> ${data.email || "-"}<br>
      <strong>UID:</strong> ${data.uid || "-"}<br>
      <strong>表示名:</strong> ${data.displayName || "-"}<br>
      <strong>IP:</strong> ${data.ipAddress || "-"}<br>
      <strong>タイムゾーン:</strong> ${data.timezone || "-"}<br>
      <strong>画面:</strong> ${data.screenWidth || "-"} × ${data.screenHeight || "-"}<br>
      <strong>UserAgent:</strong><br>
      <strong>チャット内容:</strong> ${data.message || "-"}<br>
      <small>${data.userAgent || "-"}</small>
      <hr>
    `;

        logList.appendChild(div);
    });
}