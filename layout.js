import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const adminEmails = [
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp"
];

window.addEventListener("DOMContentLoaded", ()=>{

    const sidebar = document.getElementById("sidebar");
    const profileName = document.getElementById("profileName");
    const logoutBtn = document.getElementById("logoutBtn");
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    /* ===== 認証監視（ここだけ！） ===== */
    onAuthStateChanged(auth, (user)=>{

        if(!user){
            location.href = "index.html";
            return;
        }

        if(profileName){
            profileName.textContent = user.email;
        }

        // 管理者アイコン追加
        if(adminEmails.includes(user.email) && sidebar){

            if(!document.getElementById("adminSettingIcon")){
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

        // 🔥 ここ追加
        const clearBtn = document.getElementById("clearBtn");

        if(clearBtn){
            if(adminEmails.includes(user.email)){
                clearBtn.style.display = "inline-block";
            }else{
                clearBtn.style.display = "none";
            }
        }

    });

    /* ===== ログアウト ===== */
    logoutBtn?.addEventListener("click", async ()=>{

        const user = auth.currentUser;

        if(user){
            try{
                await addDoc(collection(db,"loginLogs"),{
                    action: "logout",
                    email: user.email,
                    uid: user.uid,
                    timestamp: serverTimestamp()
                });
            }catch(e){
                console.log("ログアウト記録失敗:", e);
            }
        }

        await signOut(auth);
        location.href = "index.html";

    });
    /* ===== プロフィール開閉 ===== */
    if(profileBtn && profileMenu){

        profileBtn.addEventListener("click", (e)=>{
            e.stopPropagation();
            profileMenu.classList.toggle("show");
        });

        document.addEventListener("click", ()=>{
            profileMenu.classList.remove("show");
        });

        profileMenu.addEventListener("click",(e)=>{
            e.stopPropagation();
        });
    }
});

/* ===== ヘッダー時計 ===== */
function startHeaderClock(){

    function update(){
        const el = document.getElementById("headerClock");
        if(!el) return;

        const now = new Date();

        const date =
            now.getFullYear() + "/" +
            String(now.getMonth()+1).padStart(2,"0") + "/" +
            String(now.getDate()).padStart(2,"0");

        const time =
            String(now.getHours()).padStart(2,"0") + ":" +
            String(now.getMinutes()).padStart(2,"0") + ":" +
            String(now.getSeconds()).padStart(2,"0");

        el.textContent = date + "  " + time;
    }

    update();
    setInterval(update,1000);
}

import { addDoc, collection, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

try{
    await addDoc(collection(db,"logs"),{
        email: user.email,
        page: window.location.pathname,
        timestamp: serverTimestamp()
    });
}catch(e){
    console.log("ログ保存エラー:", e);
}

startHeaderClock();
