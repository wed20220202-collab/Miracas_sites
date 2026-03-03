import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/* Firebase設定 */
const firebaseConfig = {
  apiKey: "AIzaSyCIQhHuF3we247IxmhrO3j-Gmr5RFYf-q4",
  authDomain: "chat-sites.firebaseapp.com",
  projectId: "chat-sites",
  storageBucket: "chat-sites.firebasestorage.app",
  messagingSenderId: "36894057874",
  appId: "1:36894057874:web:2ae9634f2b1d1081a90d4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* =========================
   認証 & 管理者チェック
========================= */
import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const adminEmails = [
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp"
];

onAuthStateChanged(auth, (user)=>{

    // 未ログイン
    if(!user){
        location.href="404.html";
        return;
    }

    // 管理者以外
    if(!adminEmails.includes(user.email)){
        location.href="404.html";
        return;
    }

    // ここまで来たら管理者
    console.log("管理者認証OK");
});


/* =========================
   利用時間保存
========================= */
document.getElementById("saveTimeBtn")
.addEventListener("click", async ()=>{

    const start = Number(
        document.getElementById("startHour").value
    );

    const end = Number(
        document.getElementById("endHour").value
    );

    await setDoc(doc(db,"setting","system"),{
        startHour:start,
        endHour:end
    });

    alert("保存しました");
});

/* =========================
   利用時間読込
========================= */
async function loadSystemSetting(){

    const snap = await getDoc(
        doc(db,"setting","system")
    );

    if(!snap.exists()) return;

    const data = snap.data();

    document.getElementById("startHour").value =
        data.startHour;

    document.getElementById("endHour").value =
        data.endHour;
}

/* =========================
   チャット全削除
========================= */
document.getElementById("deleteChatBtn")
.addEventListener("click", async ()=>{

    if(!confirm("本当に削除しますか？")) return;

    const snap = await getDocs(
        collection(db,"chats")
    );

    for(const d of snap.docs){
        await deleteDoc(d.ref);
    }

    alert("削除完了");
});

/* =========================
   配置図リセット（全員waiting）
========================= */
document.getElementById("resetArrangementBtn")
.addEventListener("click", async ()=>{

    if(!confirm("本当にリセットしますか？")) return;

    const docRef = doc(db,"arrangements","current");
    const snap = await getDoc(docRef);

    if(!snap.exists()){
        alert("データが存在しません");
        return;
    }

    const data = snap.data();

    if(!data.members){
        alert("membersフィールドが存在しません");
        return;
    }

    const newMembers = {};

    // 全員 waiting に変更
    for(const name in data.members){
        newMembers[name] = "waiting";
    }

    await setDoc(docRef,{
        members: newMembers
    });

    alert("配置図を全員 waiting にリセットしました");
});

/* =========================
   ログ表示
========================= */
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* =========================
   ログアウト
========================= */
document.getElementById("logoutBtn")
.addEventListener("click",()=>{
    signOut(auth);
});
