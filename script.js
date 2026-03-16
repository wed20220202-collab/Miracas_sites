/* =============================
   Home専用スクリプト
   ・最新チャット表示
   ・時計
   ・定量定性表示
   ・管理者のみ編集可能
============================= */

import { db, auth } from "./firebase.js";
import { isAdmin } from "./admin.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const GAS_URL =
"https://script.google.com/macros/s/AKfycby7PP5BhHBukhAKsy5TznYiCo9linjsphXcsyjM6ct4LJVOavUSnUVcnhnwpu-J1_1pww/exec";

window.addEventListener("DOMContentLoaded", () => {

  /* =============================
    最新チャット表示
  ============================= */

  const chatLog = document.getElementById("chatLog");

  if (chatLog) {

    const q = query(
      collection(db, "chats"),
      orderBy("time", "desc")
    );

    onSnapshot(q, (snap) => {

      chatLog.innerHTML = "";

      snap.forEach(doc => {

        const d = doc.data();
        const div = document.createElement("div");
        div.className = "chat-item";

        const time =
          d.time?.toDate().toLocaleTimeString() || "";

        let nameHTML =
          `<span class="name">${d.name}</span>`;

        if (d.system === true) {
          nameHTML =
          `<span class="name system">Miracas_System</span>`;
        }

        div.innerHTML = `
          ${nameHTML}
          ${d.message}
          <span class="time">${time}</span>
        `;

        chatLog.appendChild(div);

      });

    });

  }

  /* =============================
     時計開始
  ============================= */

  startClock();

  /* =============================
     スプレッドシート情報
  ============================= */

  const sheetOverlay =
    document.getElementById("sheetOverlay");

  const editBtn =
    document.getElementById("editSheetInfo");

  const saveBtn =
    document.getElementById("saveSheetInfo");

  const quantitativeInput =
    document.getElementById("quantitativeInput");

  const qualitativeInput =
    document.getElementById("qualitativeInput");

  const actionInput =
    document.getElementById("actionInput");

  /* =============================
     スプレッドシート読み込み
  ============================= */

  function loadSheetInfo(){

    fetch(GAS_URL)
    .then(r => r.json())
    .then(data => {

      document.getElementById("quantitativeText").textContent =
        data.quantitative;

      document.getElementById("qualitativeText").textContent =
        data.qualitative;

      document.getElementById("actionText").textContent =
        data.action;

    });

  }

  loadSheetInfo();

  /* =============================
     編集ボタン
  ============================= */

  if(editBtn){

    editBtn.addEventListener("click",()=>{

      quantitativeInput.value =
        document.getElementById("quantitativeText").textContent;

      qualitativeInput.value =
        document.getElementById("qualitativeText").textContent;

      actionInput.value =
        document.getElementById("actionText").textContent;

      sheetOverlay.classList.add("show");

    });

  }

  /* =============================
     背景クリックで閉じる
  ============================= */

  if(sheetOverlay){

    sheetOverlay.addEventListener("click", e => {

      if(e.target === sheetOverlay){
        sheetOverlay.classList.remove("show");
      }

    });

  }

  /* =============================
     保存
  ============================= */

  if(saveBtn){

    saveBtn.addEventListener("click", async ()=>{

      await fetch(GAS_URL,{
        method:"POST",
        body:JSON.stringify({
          quantitative: quantitativeInput.value,
          qualitative: qualitativeInput.value,
          action: actionInput.value
        })
      });

      sheetOverlay.classList.remove("show");

      loadSheetInfo();

    });

  }

  /* =============================
     管理者のみ編集可能
  ============================= */

  auth.onAuthStateChanged(user => {

    if(!user) return;

    const isUserAdmin = isAdmin(user.email);

    if(!isUserAdmin){

      // 入力欄を編集不可
      quantitativeInput.readOnly = true;
      qualitativeInput.readOnly = true;
      actionInput.readOnly = true;

      // 保存ボタンだけ非表示
      if(saveBtn){
        saveBtn.style.display = "none";
      }

    }

  });

});



/* =============================
   時計
============================= */

function startClock() {

  setInterval(updateClock, 1000);
  updateClock();

}


function updateClock() {

  const now = new Date();

  const digital =
    document.getElementById("digitalClock");

  if (digital) {
    digital.textContent =
      now.toLocaleTimeString();
  }

  const canvas =
    document.getElementById("analogClock");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const r = 100;

  ctx.clearRect(0, 0, 200, 200);

  ctx.save();
  ctx.translate(r, r);

  ctx.beginPath();
  ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.stroke();

  drawNumbers(ctx, r);

  const sec =
    now.getSeconds() * Math.PI / 30;

  const min =
    now.getMinutes() * Math.PI / 30;

  const hr =
    (now.getHours() % 12) * Math.PI / 6
    + min / 12;

  drawHand(ctx, hr, 50, 6);
  drawHand(ctx, min, 70, 4);
  drawHand(ctx, sec, 90, 2);

  ctx.restore();

}


function drawHand(ctx, pos, len, width) {

  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.moveTo(0, 0);

  ctx.rotate(pos);
  ctx.lineTo(0, -len);

  ctx.stroke();
  ctx.rotate(-pos);

}


function drawNumbers(ctx, radius) {

  ctx.font = radius * 0.18 + "px Arial";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";

  for (let num = 1; num <= 12; num++) {

    const ang = num * Math.PI / 6;

    const x =
      Math.sin(ang) * (radius * 0.8);

    const y =
      -Math.cos(ang) * (radius * 0.8);

    ctx.fillText(num.toString(), x, y);

  }

}

async function loadPreviousReview(){

  const url = "https://script.google.com/macros/s/AKfycbzUC3JTLPcTzeDERHkZaVbgur2YZAhuAqCCZcKem0fdufqXmqOoWvedFYX-YddpFn1mvA/exec?action=previousReview";

  try{

    const res = await fetch(url);
    const data = await res.json();

    function setText(id, text){
      const el = document.getElementById(id);
      if(el) el.textContent = text;
    }

    if(data.error){
      setText("improveText","データなし");
      setText("improveTextSp","データなし");
      return;
    }

    // データ反映（PC）
    setText("improveText", data.review || "");
    setText("otherText", data.other || "");

    // データ反映（SP）
    setText("improveTextSp", data.review || "");
    setText("otherTextSp", data.other || "");

    // truncate
    truncateText("improveText",160);
    truncateText("otherText",160);
    truncateText("improveTextSp",160);
    truncateText("otherTextSp",160);

  }catch(e){

    const el = document.getElementById("improveText");
    if(el) el.textContent = "読み込みエラー";

  }

}

loadPreviousReview();

function truncateText(id, maxLength = 160){
  const el = document.getElementById(id);
  if(!el) return;

  let text = el.textContent || "";
  
  // 文字数が maxLength を超える場合
  if(text.length > maxLength){
    el.textContent = text.slice(0, maxLength - 1) + "…";
  }
}