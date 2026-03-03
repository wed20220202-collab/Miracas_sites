import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    deleteDoc
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
   利用時間保存
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

    if(!confirm("本当に削除しますか？")) return;

    const snap = await getDocs(collection(db,"chats"));

    for(const d of snap.docs){
        await deleteDoc(d.ref);
    }

    alert("削除完了");
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

    alert("全員リセットしました");
});

/* =========================
   ログアウト
========================= */

document.getElementById("logoutBtn")
.addEventListener("click",()=>{
    signOut(auth);
});