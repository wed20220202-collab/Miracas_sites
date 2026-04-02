import { auth, db } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup } 
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();

/* =========================
   ログ保存（最大200件）
========================= */
async function saveLoginLog(user){

    const logsRef = collection(db, "loginLogs");

    await addDoc(logsRef, {

        /* 🔥 基本情報 */
        action: "login",                 // ← ログイン種別
        mail: user.email,                // ← mailフィールド
        email: user.email,               // ← 既存
        uid: user.uid,
        displayName: user.displayName || null,

        /* 🔥 時刻 */
        loginTime: serverTimestamp(),    // ← ログイン時刻（明示）
        timestamp: serverTimestamp(),    // ← 並び替え用

        /* 🔥 端末情報 */
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenWidth: screen.width,
        screenHeight: screen.height

    });

    // ===== 最大200件制限 =====
    const q = query(logsRef, orderBy("timestamp", "desc"));
    const snap = await getDocs(q);

    if(snap.size > 200){
        const docs = snap.docs;
        for(let i = 200; i < docs.length; i++){
            await deleteDoc(docs[i].ref);
        }
    }
}

/* =========================
   ログイン処理
========================= */

document.getElementById("googleLogin")
.addEventListener("click", async () => {

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const email = user.email;

        // ドメイン制限
        if (
            !(email.endsWith("@sankogakuen.jp") || email === "kousei10160926@gmail.com" || email === "sohuta0810@gmail.com")
        ) {
            alert("学校アカウントでログインしてください");
            await auth.signOut();
            return;
        }

        // 🔥 ログ保存（先にやる）
        await saveLoginLog(user);

        // ログイン成功
        location.href = "home.html";

    } catch (e) {
        document.getElementById("error").textContent = "ログイン失敗";
        console.error(e);
    }

});

document.getElementById("form")
.addEventListener("click", () => {
    window.open("https://forms.gle/55ei8eiAGBAg9Hbi6","_blank");
});