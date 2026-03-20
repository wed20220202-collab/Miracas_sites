/* ===========================
   GAS URL
=========================== */
const GAS_URL = "https://script.google.com/macros/s/AKfycbzAZ5hEEcVgVJKKt_JjHMUpERSXMTd8ZKR0KS-E-1xlIzQrhU7FCIh4E-GWvsO3bUTIsg/exec";

/* ===========================
   Firebase
=========================== */
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

let currentDate = null;
let userName = "";
let userEmail = "";

/* ===========================
   日付形式統一
=========================== */
function normalizeDate(date){
  return date.replaceAll("-", "/");
}

/* ===========================
   ローディング表示
=========================== */
function showLoading(){
  const overlay = document.getElementById("loadingOverlay");
  if(overlay) overlay.classList.add("active");
}

function hideLoading(){
  const overlay = document.getElementById("loadingOverlay");
  if(overlay) overlay.classList.remove("active");
}

/* ===========================
   エディタの有効化/無効化
=========================== */
function disableEditor(){
  document
    .querySelectorAll(".event-editor input, .event-editor select, .event-editor textarea")
    .forEach(el=>{
      el.disabled = true;
    });
}

function enableEditor(){
  document
    .querySelectorAll(".event-editor input, .event-editor select, .event-editor textarea")
    .forEach(el=>{
      el.disabled = false;
    });
}

/* ===========================
   JSONP ユーティリティ（v4）
   GASはリダイレクトを経由するためfetch()ではCORSヘッダーが
   ブラウザに届かない。JSONPを使うことで回避する。
=========================== */
function jsonpFetch(url){
  return new Promise((resolve, reject) => {

    const callbackName = "jsonpCb_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    const script = document.createElement("script");

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP timeout (15秒以内に応答がありません)"));
    }, 15000);

    function cleanup(){
      clearTimeout(timer);
      delete window[callbackName];
      if(script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = function(data){
      cleanup();
      
      /* GASからのエラーレスポンスをチェック */
      if(data && data.error){
        reject(new Error("GAS Error: " + data.error));
      }else{
        resolve(data);
      }
    };

    const sep = url.includes("?") ? "&" : "?";
    script.src = url + sep + "callback=" + callbackName;
    
    script.onerror = function(){
      cleanup();
      reject(new Error("JSONP script load error - MIMEタイプまたはネットワークエラー"));
    };

    document.head.appendChild(script);
  });
}

/* ===========================
   JSONP POST（v4）
   GASはGETのみJSONPが使えるため、POSTデータはGETパラメータに
   変換して送信する。
   
   重要：URLの長さ制限（約2000文字）を超えないようにする
=========================== */
function jsonpPost(url, data){
  const params = new URLSearchParams();
  
  /* method=POST を明示的に設定 */
  params.set("method", "POST");
  
  /* すべてのデータをパラメータに追加 */
  Object.keys(data).forEach(k => {
    const value = data[k] !== undefined ? String(data[k]).trim() : "";
    params.set(k, value);
  });
  
  const fullUrl = url + "?" + params.toString();
  
  /* URLの長さをチェック */
  if(fullUrl.length > 2000){
    console.warn("Warning: URL length is " + fullUrl.length + " characters");
  }
  
  console.log("POST URL length: " + fullUrl.length);
  console.log("POST URL: " + fullUrl.substring(0, 200) + "...");
  
  return jsonpFetch(fullUrl);
}

/* ===========================
   初期化
=========================== */
document.addEventListener("DOMContentLoaded", () => {

  initDateSelect();
  initCalendar();
  disableEditor();

  /* Firebase認証の初期化 */
  onAuthStateChanged(auth, user => {

    if(!user){
      alert("ログインしてください");
      location.href = "login.html";
      return;
    }

    userEmail = user.email;
    userName = userEmail.split("@")[0];

    /* メールアドレスを表示 */
    const emailDisplay = document.getElementById("emailDisplay");
    if(emailDisplay){
      emailDisplay.textContent = userEmail;
    }

  });

});

/* ===========================
   カレンダー
=========================== */
function initCalendar(){

  const calendar = new FullCalendar.Calendar(
    document.getElementById("calendar"),
    {

      initialView:"dayGridMonth",

      dateClick: async function(info){

        showLoading();

        const date = normalizeDate(info.dateStr);

        try{

          console.log("Fetching data for date: " + date);

          const sheetName = userName + "_" + date;

          const data = await jsonpFetch(
            GAS_URL + "?date=" + encodeURIComponent(sheetName)
          );

          console.log("Received data:", data);

          currentDate = date;

          const [y,m,d] = info.dateStr.split("-");

          document.getElementById("d3").value = y;
          document.getElementById("e3").value = parseInt(m);
          document.getElementById("g3").value = parseInt(d);

          Object.keys(data).forEach(key=>{

            const el = document.getElementById(key);
            if(!el) return;

            let value = String(data[key] || "");

            el.value = value;

          });

          enableEditor();

        }catch(err){

          console.error("Calendar fetch error:", err);

          /* シートが無い場合 */
          if(err.message.includes("no sheet")){

            const ok = confirm(
              date + " のＯＣシートが存在しません。\n作成しますか？"
            );

            if(ok){

              try{

                const sheetName = userName + "_" + date;

                const res = await jsonpFetch(
                  GAS_URL +
                  "?action=create&sheet=" +
                  encodeURIComponent(sheetName)
                );

                alert("ＯＣシートを作成しました");
                disableEditor();

              }catch(e){

                alert("シート作成エラー\n" + e.message);

              }

            }

          }else{

            alert("データ取得エラー\n詳細: " + err.message);

          }

        }finally{

          hideLoading();

        }

      }

    });

  calendar.render();

}

/* ===========================
   年月日セレクト
=========================== */
function initDateSelect(){

  const y = document.getElementById("d3");
  const m = document.getElementById("e3");
  const d = document.getElementById("g3");

  for(let i=2020;i<=2030;i++){
    y.add(new Option(i,i));
  }

  for(let i=1;i<=12;i++){
    m.add(new Option(i,i));
  }

  for(let i=1;i<=31;i++){
    d.add(new Option(i,i));
  }

}

/* ===========================
   ユーティリティ
=========================== */
function val(id){
  const el = document.getElementById(id);
  return el ? el.value : "";
}

/* ===========================
   保存（v4）
   - POSTリクエストとして送信
   - レスポンスで {result:"ok"} を確認
   - 保存内容をコンソールに詳細出力
=========================== */
async function saveEvent(){

  if(!currentDate){
    alert("日付を選択してください");
    return;
  }

  if(!userName){
    alert("ユーザー情報を取得できていません。ページをリロードしてください");
    return;
  }

  showLoading();

  try{

    const sheetName = userName + "_" + currentDate;

    const data = {
      date: sheetName,

      e3: val("e3"),
      g3: val("g3"),
      k3: val("k3"),
      m3: val("m3"),

      e5: val("e5"),
      e6: val("e6"),
      e7: val("e7"),
      j6: val("j6"),

      f8: val("f8"),
      j8: val("j8"),

      e11: val("e11"),
      e12: val("e12"),
      e13: val("e13")
    };

    console.log("Saving data:", data);

    const result = await jsonpPost(GAS_URL, data);

    console.log("Save result:", result);

    if(result && result.result === "ok"){
      alert("保存しました");
    }else{
      alert("保存完了（レスポンス: " + JSON.stringify(result) + "）");
    }

  }catch(err){

    alert("保存エラー\n" + err.message);

  }finally{

    hideLoading();

  }

}

/* ===========================
   シート作成
=========================== */
async function createSheet(){

  let date = prompt("作成する日付 (例: 2026/04/20)");

  if(!date) return;

  date = normalizeDate(date);

  if(!userName){
    alert("ユーザー情報を取得できていません。ページをリロードしてください");
    return;
  }

  showLoading();

  try{

    console.log("Creating sheet for date: " + date);

    const sheetName = userName + "_" + date;

    const text = await jsonpFetch(
      GAS_URL +
      "?action=create&sheet=" +
      encodeURIComponent(sheetName)
    );

    console.log("Create result:", text);

    /* JSONPの場合、GASからの返値は文字列またはオブジェクト */

    const result = typeof text === "string" ? text : JSON.stringify(text);

    if(result === "created" || result.includes("created")){
      alert("ＯＣシート作成完了");
    }else if(result === "exists" || result.includes("exists")){
      alert("既に存在します");
    }else{
      alert(result);
    }

  }catch(err){

    console.error("Create sheet error:", err);
    alert("シート作成エラー\n" + err.message);

  }finally{

    hideLoading();

  }

}

/* ===========================
   グローバル関数登録
=========================== */
window.saveEvent = saveEvent;
window.createSheet = createSheet;
