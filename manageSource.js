import { db, auth } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) return;   // ← これ超重要

    await loadLatestSetting();

});


/* =============================
   保存処理（自動ID）
============================= */
document.getElementById("saveSourceBtn")
.addEventListener("click", async () => {

    const type = document.querySelector(
        "input[name='sourceType']:checked"
    )?.value;

    const url = document.getElementById("sheetUrl").value.trim();

    if (!type || !url) {
        alert("種類とURLを入力してください");
        return;
    }

    await addDoc(collection(db, "setting"), {
        type,
        url,
        createdAt: serverTimestamp()
    });

    alert("保存しました");

    fetchSheet(type, url);
});

/* =============================
   最新の設定を取得
============================= */
async function loadLatestSetting(){

    const q = query(
        collection(db, "setting"),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) return;

    const data = snap.docs[0].data();

    document.querySelector(
        `input[value='${data.type}']`
    ).checked = true;

    document.getElementById("sheetUrl").value = data.url;

    fetchSheet(data.type, data.url);
}

/* =============================
   データ取得
============================= */
async function fetchSheet(type, url){

    let fetchUrl = url;

    if (type === "google") {

        const match = url.match(/\/d\/(.*?)\//);
        if (!match) {
            alert("URL形式が不正です");
            return;
        }

        const sheetId = match[1];

        fetchUrl =
        `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    }

    try {

        const res = await fetch(fetchUrl);
        const text = await res.text();

        parseCSV(text);

    } catch (e) {
        alert("データ取得失敗");
        console.error(e);
    }
}

/* =============================
   CSV解析
============================= */
function parseCSV(csv){

    const rows = csv.split("\n").map(r=>r.split(","));

    console.log("取得データ:", rows);

    // ここで displayVisitors に渡す処理を書く
}
