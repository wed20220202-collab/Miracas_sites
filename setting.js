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
  "vga29-pc250029@sankogakuen.jp"
];

onAuthStateChanged(auth, (user)=>{
    if(!user || !adminEmails.includes(user.email)){
        location.href="404.html";
    }
});

/* =========================
   利用時間 読込
========================= */

window.addEventListener("DOMContentLoaded", async ()=>{

    const docRef = doc(db,"settings","timeConfig");
    const snap   = await getDoc(docRef);

    if(snap.exists()){
        const data = snap.data();
        document.getElementById("startHour").value = data.startHour;
        document.getElementById("endHour").value   = data.endHour;
    }

    loadLoginLogs();
});

/* =========================
   利用時間 保存
========================= */

document.getElementById("saveTimeBtn")
.addEventListener("click", async ()=>{

    const start = Number(document.getElementById("startHour").value);
    const end   = Number(document.getElementById("endHour").value);

    await setDoc(doc(db,"settings","timeConfig"),{
        startHour:start,
        endHour:end
    });

    alert("保存しました");
});

/* =========================
   チャット全削除
========================= */

document.getElementById("deleteChatBtn")
.addEventListener("click", async ()=>{

    if(!confirm("本当に全チャットを削除しますか？")) return;

    const snap = await getDocs(collection(db,"chats"));

    for(const d of snap.docs){
        await deleteDoc(d.ref);
    }

    alert("全チャット削除完了");
});

/* =========================
   配置図リセット
========================= */

document.getElementById("resetArrangementBtn")
.addEventListener("click", async ()=>{

    if(!confirm("本当にリセットしますか？")) return;

    const docRef = doc(db,"arrangements","current");
    const snap   = await getDoc(docRef);

    if(!snap.exists()){
        alert("データが存在しません");
        return;
    }

    const data = snap.data();
    const newMembers = {};

    for(const name in data.members){
        newMembers[name] = "waiting";
    }

    await setDoc(docRef,{
        members:newMembers
    });

    alert("配置図を全員 waiting にリセットしました");
});

/* =========================
   ログ表示
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

/* =========================
   ログアウト
========================= */

document.getElementById("logoutBtn")
.addEventListener("click",()=>{
    signOut(auth);
});