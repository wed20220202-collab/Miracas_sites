import { auth } from "./firebase.js";
import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const adminEmails = [
  "vga29-pc250033@sankogakuen.jp",
  "vga29-pc250006@sankogakuen.jp",
  "vga29-pc250029@sankogakuen.jp",
  "12210295@sankogakuen.jp",
  "12010311@sankogakuen.jp"
];

onAuthStateChanged(auth, (user) => {

    // 未ログイン
    if (!user) {
        location.href = "404.html";
        return;
    }

    // 管理者でない
    if (!adminEmails.includes(user.email)) {
        location.href = "404.html";
        return;
    }

    // ここに来たら管理者OK
});
