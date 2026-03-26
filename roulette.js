import { db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* =========================
   Canvas
========================= */
const leftCanvas = document.getElementById("wheelLeft");
const rightCanvas = document.getElementById("wheelRight");

const leftCtx = leftCanvas.getContext("2d");
const rightCtx = rightCanvas.getContext("2d");

/* =========================
   データ
========================= */
let numbers = [];
let prizes = [];

/* =========================
   状態
========================= */
let leftRotation = 0;
let rightRotation = 0;

let spinningLeft = false;
let spinningRight = false;

let leftWinner = null;
let rightWinner = null;

/* =========================
   Firestore同期（番号）
========================= */
onSnapshot(collection(db, "users"), (snap) => {
  numbers = snap.docs.map(d => d.data().number);
  drawWheel(leftCtx, numbers, leftRotation);
});

/* =========================
   景品入力
========================= */
window.setPrizes = function () {
  const input = document.getElementById("prizeInput").value;
  prizes = input.split(",").map(v => v.trim()).filter(v => v);
  drawWheel(rightCtx, prizes, rightRotation);
};

/* =========================
   描画
========================= */
function drawWheel(ctx, items, rotation) {
  const size = 400;
  const center = size / 2;
  const radius = 180;

  ctx.clearRect(0, 0, size, size);

  if (items.length === 0) return;

  const arc = (2 * Math.PI) / items.length;

  items.forEach((item, i) => {
    const angle = i * arc + rotation;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + arc);
    ctx.fillStyle = `hsl(${i * 40}, 70%, 60%)`;
    ctx.fill();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle + arc / 2);
    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    ctx.fillText(item, radius / 2, 5);
    ctx.restore();
  });

  // ▶ 右側に当たり位置マーカー
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(size - 10, center);
  ctx.lineTo(size - 30, center - 10);
  ctx.lineTo(size - 30, center + 10);
  ctx.fill();
}

/* =========================
   回転処理
========================= */
function spinWheel(ctx, items, isLeft) {
  return new Promise(resolve => {

    let speed = Math.random() * 0.3 + 0.4;
    let rotation = 0;

    function animate() {
      speed *= 0.97;
      rotation += speed;

      if (isLeft) {
        leftRotation = rotation;
        drawWheel(leftCtx, items, leftRotation);
      } else {
        rightRotation = rotation;
        drawWheel(rightCtx, items, rightRotation);
      }

      if (speed > 0.002) {
        requestAnimationFrame(animate);
      } else {
        // 🎯 右側が当たり
        const arc = (2 * Math.PI) / items.length;
        const pointerAngle = 0; // 右方向

        const adjusted =
          (2 * Math.PI - (rotation % (2 * Math.PI)) + pointerAngle) % (2 * Math.PI);

        const index = Math.floor(adjusted / arc);
        const result = items[index];

        resolve(result);
      }
    }

    animate();
  });
}

/* =========================
   スタート
========================= */
window.spin = async function () {

  if (numbers.length === 0 || prizes.length === 0) {
    alert("番号 or 景品が空");
    return;
  }

  // 結果を一旦消す
  document.getElementById("result").innerText = "抽選中...";

  /* =====================
     ① 左スタート
  ===================== */
  const num = await spinWheel(leftCtx, numbers, true);

  /* =====================
     ② 0.5秒待機
  ===================== */
  await new Promise(r => setTimeout(r, 500));

  /* =====================
     ③ 右スタート
  ===================== */
  const prize = await spinWheel(rightCtx, prizes, false);

  /* =====================
     ④ 両方終わってから表示
  ===================== */
  document.getElementById("result").innerText =
    `番号：${num} → 景品：${prize}`;
};