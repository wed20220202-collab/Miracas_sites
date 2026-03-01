/* =============================
   Home専用スクリプト
   ・最新チャット表示
   ・時計
   ※ 認証は layout.js がやる
============================= */

import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

        div.innerHTML = `
          <span class="name">${d.name}</span>
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
    const x = Math.sin(ang) * (radius * 0.8);
    const y = -Math.cos(ang) * (radius * 0.8);

    ctx.fillText(num.toString(), x, y);
  }
}
