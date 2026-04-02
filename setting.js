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
    "12010311@sankogakuen.jp",
    "kousei10160926@gmail.com",
    "sohuta0810@gmail.com"
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
  const deleterouletteBtn = document.getElementById("deleterouletteBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const locklist = document.getElementById("lockList");
  const lockManage = document.getElementById("lockManage");
  const lockChat = document.getElementById("lockChat");
  const lockArrangement = document.getElementById("lockArrangement");
  const lockCaptain = document.getElementById("lockCaptain");
  const lockRoulette = document.getElementById("lockRoulette");
  const saveLockBtn = document.getElementById("saveLockBtn");

  const lockRef = doc(db,"settings","siteLocks");

  const docRef = doc(db,"settings","timeConfig");

  /* ===== 利用時間読込 ===== */
  const snap = await getDoc(docRef);
  if(snap.exists()){
      const data = snap.data();
      startInput.value = data.startHour;
      endInput.value   = data.endHour;
  }

  /* ===== ページロック読込 ===== */

  const lockSnap = await getDoc(lockRef);

  if(lockSnap.exists()){
      const data = lockSnap.data();

      locklist.checked = data.list || false;
      lockManage.checked = data.manage || false;
      lockChat.checked = data.chat || false;
      lockArrangement.checked = data.arrangement || false;
      lockCaptain.checked = data.captain || false;
      lockRoulette.checked = data.roulette || false;
  }

  /* ===== ページロック保存 ===== */

  saveLockBtn.addEventListener("click", async ()=>{

      await setDoc(lockRef,{
          list: locklist.checked,
          manage: lockManage.checked,
          chat: lockChat.checked,
          arrangement: lockArrangement.checked,
          captain: lockCaptain.checked,
          roulette: lockRoulette.checked
      });

      alert("保存しました");

      location.reload();

  });

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

  deleterouletteBtn.addEventListener("click", async ()=>{
      if(!confirm("本当に削除しますか？")) return;

      const snap = await getDocs(collection(db,"users"));
      for(const d of snap.docs){
          await deleteDoc(d.ref);
      }
      alert("削除完了");
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

/* =========================
   チャットリアクション設定
========================= */

const reactionSelector = document.getElementById("reactionSelector");
const saveReactionsBtn = document.getElementById("saveReactionsBtn");

// ここに実際の SVG/PNG 画像 URL を列挙
const allEmojiImages = [
    "icons/emoji/emoji_1.svg",
    "icons/emoji/emoji_2.svg",
    "icons/emoji/emoji_3.svg",
    "icons/emoji/emoji_4.svg",
    "icons/emoji/emoji_5.svg",
    "icons/emoji/emoji_6.svg",
    "icons/emoji/emoji_7.svg",
    "icons/emoji/emoji_8.svg",
    "icons/emoji/emoji_9.svg",
    "icons/emoji/emoji_10.svg",
    "icons/emoji/emoji_11.svg",
    "icons/emoji/emoji_12.svg",
    "icons/emoji/emoji_13.svg",
    "icons/emoji/emoji_14.svg",
    "icons/emoji/emoji_15.svg",
    "icons/emoji/emoji_16.svg",
    "icons/emoji/emoji_17.svg",
    "icons/emoji/emoji_18.svg",
    "icons/emoji/emoji_19.svg",
    "icons/emoji/emoji_20.svg",
    "icons/emoji/emoji_21.svg",
    "icons/emoji/emoji_22.svg",
    "icons/emoji/emoji_23.svg",
    "icons/emoji/emoji_24.svg",
    "icons/emoji/emoji_25.svg",
    "icons/emoji/emoji_26.svg",
    "icons/emoji/emoji_27.svg",
    "icons/emoji/emoji_28.svg",
    "icons/emoji/emoji_29.svg",
    "icons/emoji/emoji_30.svg",
    "icons/emoji/emoji_31.svg",
    "icons/emoji/emoji_32.svg",
    "icons/emoji/emoji_33.svg",
    "icons/emoji/emoji_34.svg",
    "icons/emoji/emoji_35.svg",
    "icons/emoji/emoji_36.svg",
    "icons/emoji/emoji_37.svg",
    "icons/emoji/emoji_38.svg",
    "icons/emoji/emoji_39.svg",
    "icons/emoji/emoji_40.svg",
    "icons/emoji/emoji_41.svg",
    "icons/emoji/emoji_42.svg",
    "icons/emoji/emoji_43.svg",
    "icons/emoji/emoji_44.svg",
    "icons/emoji/emoji_45.svg",
    "icons/emoji/emoji_46.svg",
    "icons/emoji/emoji_47.svg",
    "icons/emoji/emoji_48.svg",
    "icons/emoji/emoji_49.svg",
    "icons/emoji/emoji_50.svg",
    "icons/emoji/emoji_51.svg",
    "icons/emoji/emoji_52.svg",
    "icons/emoji/emoji_53.svg",
    "icons/emoji/emoji_54.svg",
    "icons/emoji/emoji_55.svg",
    "icons/emoji/emoji_56.svg",
    "icons/emoji/emoji_57.svg",
    "icons/emoji/emoji_58.svg",
    "icons/emoji/emoji_59.svg",
    "icons/emoji/emoji_60.svg",
    "icons/emoji/emoji_61.svg",
    "icons/emoji/emoji_62.svg",
    "icons/emoji/emoji_63.svg",
    "icons/emoji/emoji_64.svg",
    "icons/emoji/emoji_65.svg",
    "icons/emoji/emoji_66.svg",
    "icons/emoji/emoji_67.svg",
    "icons/emoji/emoji_68.svg",
    "icons/emoji/emoji_69.svg",
    "icons/emoji/emoji_70.svg",
    "icons/emoji/emoji_71.svg",
    "icons/emoji/emoji_72.svg",
    "icons/emoji/emoji_73.svg",
    "icons/emoji/emoji_74.svg",
    "icons/emoji/emoji_75.svg",
    "icons/emoji/emoji_76.svg",
    "icons/emoji/emoji_77.svg",
    "icons/emoji/emoji_78.svg",
    "icons/emoji/emoji_79.svg",
    "icons/emoji/emoji_80.svg",
    "icons/emoji/emoji_81.svg",
    "icons/emoji/emoji_82.svg",
    "icons/emoji/emoji_83.svg",
    "icons/emoji/emoji_84.svg",
    "icons/emoji/emoji_85.svg",
    "icons/emoji/emoji_86.svg",
    "icons/emoji/emoji_87.svg",
    "icons/emoji/emoji_88.svg",
    "icons/emoji/emoji_89.svg",
    "icons/emoji/emoji_90.svg",
    "icons/emoji/emoji_91.svg",
    "icons/emoji/emoji_92.svg",
    "icons/emoji/emoji_93.svg",
    "icons/emoji/emoji_94.svg",
    "icons/emoji/emoji_95.svg",
    "icons/emoji/emoji_96.svg",
    "icons/emoji/emoji_97.svg",
    "icons/emoji/emoji_98.svg",
    "icons/emoji/emoji_99.svg",
    "icons/emoji/emoji_100.svg",
    "icons/emoji/emoji_101.svg",
    "icons/emoji/emoji_102.svg",
    "icons/emoji/emoji_103.svg",
    "icons/emoji/emoji_104.svg",
    "icons/emoji/emoji_105.svg",
    "icons/emoji/emoji_106.svg",
    "icons/emoji/emoji_107.svg",
    "icons/emoji/emoji_108.svg",
    "icons/emoji/emoji_109.svg",
    "icons/emoji/emoji_110.svg",
    "icons/emoji/emoji_111.svg",
    "icons/emoji/emoji_112.svg",
    "icons/emoji/emoji_113.svg",
    "icons/emoji/emoji_114.svg",
    "icons/emoji/emoji_115.svg",
    "icons/emoji/emoji_116.svg",
    "icons/emoji/emoji_117.svg",
    "icons/emoji/emoji_118.svg",
    "icons/emoji/emoji_119.svg",
    "icons/emoji/emoji_120.svg",
    "icons/emoji/emoji_121.svg",
    "icons/emoji/emoji_122.svg",
    "icons/emoji/emoji_123.svg",
    "icons/emoji/emoji_124.svg",
    "icons/emoji/emoji_125.svg",
    "icons/emoji/emoji_126.svg",
    "icons/emoji/emoji_127.svg",
    "icons/emoji/emoji_128.svg",
    "icons/emoji/emoji_129.svg",
    "icons/emoji/emoji_130.svg",
    "icons/emoji/emoji_131.svg",
    "icons/emoji/emoji_132.svg",
    "icons/emoji/emoji_133.svg",
    "icons/emoji/emoji_134.svg",
    "icons/emoji/emoji_135.svg",
    "icons/emoji/emoji_136.svg",
    "icons/emoji/emoji_137.svg",
    "icons/emoji/emoji_138.svg",
    "icons/emoji/emoji_139.svg",
    "icons/emoji/emoji_140.svg",
    "icons/emoji/emoji_141.svg",
    "icons/emoji/emoji_142.svg",
    "icons/emoji/emoji_143.svg",
    "icons/emoji/emoji_144.svg",
    "icons/emoji/emoji_145.svg",
    "icons/emoji/emoji_146.svg",
    "icons/emoji/emoji_147.svg",
    "icons/emoji/emoji_148.svg",
    "icons/emoji/emoji_149.svg",
    "icons/emoji/emoji_150.svg",
    "icons/emoji/emoji_151.svg",
    "icons/emoji/emoji_152.svg",
    "icons/emoji/emoji_153.svg",
    "icons/emoji/emoji_154.svg",
    "icons/emoji/emoji_155.svg",
    "icons/emoji/emoji_156.svg",
    "icons/emoji/emoji_157.svg",
    "icons/emoji/emoji_158.svg",
    "icons/emoji/emoji_159.svg",
    "icons/emoji/emoji_160.svg",
    "icons/emoji/emoji_161.svg",
    "icons/emoji/emoji_162.svg",
    "icons/emoji/emoji_163.svg",
    "icons/emoji/emoji_164.svg",
    "icons/emoji/emoji_165.svg",
    "icons/emoji/emoji_166.svg",
    "icons/emoji/emoji_167.svg",
    "icons/emoji/emoji_168.svg",
    "icons/emoji/emoji_169.svg",
    "icons/emoji/emoji_170.svg",
    "icons/emoji/emoji_171.svg",
    "icons/emoji/emoji_172.svg",
    "icons/emoji/emoji_173.svg",
    "icons/emoji/emoji_174.svg",
    "icons/emoji/emoji_175.svg",
    "icons/emoji/emoji_176.svg",
    "icons/emoji/emoji_177.svg",
    "icons/emoji/emoji_178.svg",
    "icons/emoji/emoji_179.svg",
    "icons/emoji/emoji_180.svg",
    "icons/emoji/emoji_181.svg",
    "icons/emoji/emoji_182.svg",
    "icons/emoji/emoji_183.svg",
    "icons/emoji/emoji_184.svg",
    "icons/emoji/emoji_185.svg",
    "icons/emoji/emoji_186.svg",
    "icons/emoji/emoji_187.svg",
    "icons/emoji/emoji_188.svg",
    "icons/emoji/emoji_189.svg",
    "icons/emoji/emoji_190.svg",
    "icons/emoji/emoji_191.svg",
    "icons/emoji/emoji_192.svg",
    "icons/emoji/emoji_193.svg",
    "icons/emoji/emoji_194.svg",
    "icons/emoji/emoji_195.svg",
    "icons/emoji/emoji_196.svg",
    "icons/emoji/emoji_197.svg",
    "icons/emoji/emoji_198.svg",
    "icons/emoji/emoji_199.svg",
    "icons/emoji/emoji_200.svg",
    "icons/emoji/emoji_201.svg",
    "icons/emoji/emoji_202.svg",
    "icons/emoji/emoji_203.svg",
    "icons/emoji/emoji_204.svg",
    "icons/emoji/emoji_205.svg",
    "icons/emoji/emoji_206.svg",
    "icons/emoji/emoji_207.svg",
    "icons/emoji/emoji_208.svg",
    "icons/emoji/emoji_209.svg",
    "icons/emoji/emoji_210.svg",
    "icons/emoji/emoji_211.svg",
    "icons/emoji/emoji_212.svg",
    "icons/emoji/emoji_213.svg",
    "icons/emoji/emoji_214.svg",
    "icons/emoji/emoji_215.svg",
    "icons/emoji/emoji_216.svg",
    "icons/emoji/emoji_217.svg",
    "icons/emoji/emoji_218.svg",
    "icons/emoji/emoji_219.svg",
    "icons/emoji/emoji_220.svg",
    "icons/emoji/emoji_221.svg",
    "icons/emoji/emoji_222.svg",
    "icons/emoji/emoji_223.svg",
    "icons/emoji/emoji_224.svg",
    "icons/emoji/emoji_225.svg",
    "icons/emoji/emoji_226.svg",
    "icons/emoji/emoji_227.svg",
    "icons/emoji/emoji_228.svg",
    "icons/emoji/emoji_229.svg",
    "icons/emoji/emoji_230.svg",
    "icons/emoji/emoji_231.svg",
];

// Firestore に保存するドキュメント
const reactionRef = doc(db, "settings", "chatReactions");

// 選択中の配列（最大5個）
let selectedReactions = [];

// ページ読み込み時に Firestore から設定を読み込む
async function loadReactions() {
    const snap = await getDoc(reactionRef);
    if (snap.exists()) {
        selectedReactions = snap.data().images || [];
    }
    renderReactionSelector();
}

// 選択UI描画
function renderReactionSelector() {
    if (!reactionSelector) return;
    reactionSelector.innerHTML = "";

    allEmojiImages.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.style.width = "48px";
        img.style.height = "48px";
        img.style.margin = "5px";
        img.style.cursor = "pointer";
        img.style.border = selectedReactions.includes(url) ? "3px solid #007bff" : "1px solid #ccc";
        img.style.borderRadius = "8px";

        img.onclick = () => {
            if (selectedReactions.includes(url)) {
                // クリックで解除
                selectedReactions = selectedReactions.filter(u => u !== url);
            } else {
                if (selectedReactions.length >= 5) {
                    alert("最大5枚まで選択可能です");
                    return;
                }
                selectedReactions.push(url);
            }
            renderReactionSelector();
        };

        reactionSelector.appendChild(img);
    });
}

// 保存ボタン
saveReactionsBtn?.addEventListener("click", async () => {
    await setDoc(reactionRef, { images: selectedReactions });
    alert("チャットリアクション設定を保存しました");
    location.reload();
});

// 初期読み込み
loadReactions();