/* ===============================
   Firebase Imports
================================ */
import { db, auth } from "./firebase.js";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";


/* ===============================
   管理者アドレス
================================ */
const adminEmails = [
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp",
  "12210295@sankogakuen.jp",
  "12010311@sankogakuen.jp"
];


/* ===============================
   セッション制限（3時間）
================================ */
const SESSION_LIMIT = 3 * 60 * 60 * 1000; // 3時間

function isSessionExpired() {
  const loginTime = localStorage.getItem("loginTime");
  if (!loginTime) return true;

  const diff = Date.now() - Number(loginTime);
  return diff > SESSION_LIMIT;
}

async function forceLogout() {
  localStorage.removeItem("loginTime");

  try {
    await signOut(auth);
  } catch (e) {}

  location.href = "index.html";
}

import { isAdmin } from "./admin.js";
/* ===============================
   DOM読み込み後
================================ */
window.addEventListener("DOMContentLoaded", () => {

  const sidebar = document.getElementById("sidebar");
  const profileName = document.getElementById("profileName");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");

  /* ===== 認証監視 ===== */
  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      location.href = "index.html";
      return;
    }

    // 🔥 セッション期限チェック
    if (isSessionExpired()) {
      alert("セッションの有効期限が切れました。再ログインしてください。");
      await forceLogout();
      return;
    }

    /* メール表示 */
    if (profileName) {
      profileName.textContent = user.email;
    }
    
    /* 管理者アイコン */
    if (isAdmin(user.email) && sidebar) {

      if (!document.getElementById("adminSettingIcon")) {

        const a = document.createElement("a");
        a.id = "adminSettingIcon";
        a.href = "setting.html";
        a.title = "管理者画面";

        const img = document.createElement("img");
        img.src = "icons/Setting.png";

        a.appendChild(img);
        sidebar.appendChild(a);
      }
    }

    /* 管理者専用ボタン表示 */
    const clearBtn = document.getElementById("clearBtn");

    if (clearBtn) {
      clearBtn.style.display =
        adminEmails.includes(user.email) ? "inline-block" : "none";
    }

  });


  /* ===============================
     ログアウト処理
  ================================= */
  logoutBtn?.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (user) {
      try {
        await addDoc(collection(db, "loginLogs"), {
          action: "logout",
          email: user.email,
          uid: user.uid,
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.log("ログアウト記録失敗:", e);
      }
    }

    localStorage.removeItem("loginTime");
    await signOut(auth);
    location.href = "index.html";
  });


  /* ===============================
     プロフィール開閉
  ================================= */
  if (profileBtn && profileMenu) {

    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      profileMenu.classList.remove("show");
    });

    profileMenu.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

});


/* ===============================
   ヘッダー時計
================================ */
function startHeaderClock() {

  function update() {

    const el = document.getElementById("headerClock");
    if (!el) return;

    const now = new Date();

    const date =
      now.getFullYear() + "/" +
      String(now.getMonth() + 1).padStart(2, "0") + "/" +
      String(now.getDate()).padStart(2, "0");

    const time =
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0") + ":" +
      String(now.getSeconds()).padStart(2, "0");

    el.textContent = date + "  " + time;
  }

  update();
  setInterval(update, 1000);
}

startHeaderClock();

/* ===============================
   ページロック制御
================================ */

async function checkPageLocks(){

  const lockSnap = await getDoc(doc(db,"settings","siteLocks"));

  if(!lockSnap.exists()) return;

  const locks = lockSnap.data();

  if(locks.list){
    disableCard("list","char");
  }

  if(locks.manage){
    disableCard("manage","Registrant_list");
  }

  if(locks.chat){
    disableCard("chat","chat");
  }

  if(locks.arrangement){
    disableCard("arrangement","arrangement");
  }

}

function disableCard(page,icon){

  const cards = document.querySelectorAll(`a[href="${page}.html"]`);

  cards.forEach(card=>{

    card.style.pointerEvents="none";
    card.style.opacity="0.5";
    card.style.cursor="not-allowed";

    const img = card.querySelector("img");

    if(img){
      img.src = `icons/${icon}_g.png`;
    }

  });

}

checkPageLocks();