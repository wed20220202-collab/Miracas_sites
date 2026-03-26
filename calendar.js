/* ===========================
   GAS URL
=========================== */

const GAS_URL =
"https://script.google.com/macros/s/AKfycbywFJkFL6C3W5evIxbOHif1pWwerWKZ0MEZcMdB851ER59YoGfGX4ci3NX3iy3Pu_OeEw/exec";

const AI_URL = "https://winter-forest-a82b.tokyo-ai-it-miracas.workers.dev";

let currentDate = null;


/* ===========================
   日付形式統一
=========================== */

function normalizeDate(date){
  return date.replaceAll("-", "/");
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

document.addEventListener("DOMContentLoaded",()=>{

  initDaySelect();
  initNames();
  initTeams();
  initPlaces();

  initCalendar();

  disableEditor();
});

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

         const data = await jsonpFetch(
            GAS_URL + "?date=" + encodeURIComponent(date)
         );

         console.log("Received data:", data);

         currentDate = date;

         const [y,m,d] = info.dateStr.split("-");

         document.getElementById("d3").value = y;
         document.getElementById("e3").value = parseInt(m);
         document.getElementById("f3").value = parseInt(d);

         Object.keys(data).forEach(key=>{

            const el = document.getElementById(key);
            if(!el) return;

            let value = String(data[key] || "");

            if(key==="d3") value = value.replace("年","");
            if(key==="e3") value = value.replace("月","");
            if(key==="f3") value = value.replace("日","");

            el.value = value;

         });

         enableEditor();
         updateWeekday();
         updateTeamOptions();

      }catch(err){

         console.error("Calendar fetch error:", err);

         /* シートが無い場合 */
         if(err.message.includes("no sheet")){

            const ok = confirm(
            date + " のイベントシートが存在しません。\n作成しますか？"
            );

            if(ok){

            try{

               const res = await jsonpFetch(
                  GAS_URL +
                  "?action=create&date=" +
                  encodeURIComponent(date)
               );

               alert("イベントシートを作成しました");
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
   日プルダウン
=========================== */

function initDaySelect(){

  const select = document.getElementById("f3");

  for(let i=1;i<=31;i++){

    const option = document.createElement("option");

    option.value = i;
    option.textContent = i;

    select.appendChild(option);

  }

}


/* ===========================
   曜日自動計算
=========================== */

function updateWeekday(){

  const y = document.getElementById("d3").value;
  const m = document.getElementById("e3").value;
  const d = document.getElementById("f3").value;

  if(!y || !m || !d) return;

  const date = new Date(y,m-1,d);

  const w = ["日","月","火","水","木","金","土"];

  document.getElementById("g3").value =
    w[date.getDay()] + "曜日";

}

document.addEventListener("change",e=>{

  if(["d3","e3","f3"].includes(e.target.id)){
    updateWeekday();
  }

});

/* ===========================
   名前プルダウン
=========================== */

const nameList = ["","渡部羽空","石戸巧巳","若宮莉生","清水晃聖","藤本英里","藤元恵太","溝田莉子","市川依武生"];

function initNames(){

  document.querySelectorAll(".name").forEach(select=>{

    nameList.forEach(n=>{

      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;

      select.appendChild(opt);

    });

  });

}

/* ===========================
   チームプルダウン
=========================== */

const teamList = ["","Tチーム","Kチーム","Aチーム","Iチーム","全チーム"];

function initTeams(){

  document.querySelectorAll(".team").forEach(select=>{

    teamList.forEach(t=>{

      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;

      select.appendChild(opt);

    });

  });

}

/* ===========================
   チーム重複防止
=========================== */

function updateTeamOptions(){

  const selected =
    [...document.querySelectorAll(".team")]
    .map(s=>s.value)
    .filter(v=>v);

  document.querySelectorAll(".team").forEach(select=>{

    const current = select.value;

    select.querySelectorAll("option").forEach(opt=>{

      if(opt.value=="" || opt.value==current){
        opt.disabled=false;
      }else{
        opt.disabled = selected.includes(opt.value);
      }

    });

  });

}

document.addEventListener("change",e=>{

  if(e.target.classList.contains("team")){
    updateTeamOptions();
  }

});


/* ===========================
   場所プルダウン
=========================== */

const placeList = [

  "",
  "受付",
  "2F",
  "20A","20B",
  "3F","30A","30B",
  "4F","40A","40B",
  "5F","50A","50B",
  "入試",
  "特待",
  "開発",
  "全員",
  "意見など"

];

function initPlaces(){

  document.querySelectorAll(".place").forEach(select=>{

    placeList.forEach(p=>{

      const opt = document.createElement("option");

      opt.value = p;
      opt.textContent = p;

      select.appendChild(opt);

    });

  });

}


/* ===========================
   保存（v4）
   - POSTリクエストとして送信
   - レスポンスで {result:"ok"} を確認
   - 保存内容をコンソールに詳細出力
=========================== */
function val(id){
  const el = document.getElementById(id);
  return el ? el.value : "";
}

async function saveEvent(){

  if(!currentDate){
    alert("日付を選択してください");
    return;
  }

  showLoading();

  try{

    await savePart1();
    await savePart2();
    await savePart3();
    await savePart4();

    alert("保存しました");

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

  let date =
    prompt("作成する日付 (例: 2026/04/20)");

  if(!date) return;

  date = normalizeDate(date);

  try{

    console.log("Creating sheet for date: " + date);

    const text = await jsonpFetch(
      GAS_URL +
      "?action=create&date=" +
      encodeURIComponent(date)
    );

    console.log("Create result:", text);

    /* JSONPの場合、GASからの返値は文字列またはオブジェクト */

    const result = typeof text === "string" ? text : JSON.stringify(text);

    if(result === "created" || result.includes("created")){
      alert("イベント作成完了");
    }else if(result === "exists" || result.includes("exists")){
      alert("既に存在します");
    }else{
      alert(result);
    }

  }catch(err){

    console.error("Create sheet error:", err);
    alert("作成エラー\n詳細: " + err.message);

  }

}

function showLoading(){
  document.getElementById("loadingOverlay").style.display="flex";
}

function hideLoading(){
  document.getElementById("loadingOverlay").style.display="none";
}

document.getElementById("exportPDF").addEventListener("click", async ()=>{

  const date = currentDate;

  const res = await fetch(
    GAS_URL + "?action=exportPDF&date=" + encodeURIComponent(date)
  );

  const data = await res.json();

  if(data.url){
    window.open(data.url, "_blank");
  }else{
    alert("PDF生成エラー");
  }

});

/* ===========================
   数字入力制御
=========================== */

document.addEventListener("input", e => {

  if(e.target.classList.contains("visitor-number")){

    let value = e.target.value;

    // 全角→半角
    value = value.replace(/[０-９]/g, s =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    );

    // 数字以外削除
    value = value.replace(/[^0-9]/g,"");

    e.target.value = value;

  }

});

async function savePart1(){

  const data = {
    date: normalizeDate(currentDate),
    d3: val("d3"),
    e3: val("e3"),
    f3: val("f3"),
    g3: val("g3"),
    j3: val("j3"),
    k3: val("k3"),
    g4: val("g4"),
    h4: val("h4"),
    i4: val("i4"),
    j4: val("j4"),
    k4: val("k4"),
    e6: val("e6"),
    d9: val("d9")  // ←追加
  };

  return jsonpPost(GAS_URL, data);
}

async function savePart2(){

  const data = {
    date: normalizeDate(currentDate),

    e33: val("e33"),
    i33: val("i33"),
    e34: val("e34"),
    i34: val("i34"),
    e35: val("e35"),
    i35: val("i35"),
    e36: val("e36"),
    i36: val("i36"),
    e37: val("e37"),
    i37: val("i37"),
    e38: val("e38")
  };

  return jsonpPost(GAS_URL, data);
}

async function savePart3(){

  const data = {
    date: normalizeDate(currentDate),

    e7: val("e7"),
    d11: val("d11"),
    d13: val("d13"),
    e13: val("e13"),
    d14: val("d14"),
    e14: val("e14"),
    d15: val("d15"),
    e15: val("e15"),
    d16: val("d16")
  };

  return jsonpPost(GAS_URL, data);
}

async function savePart4(){

  const data = {
    date: normalizeDate(currentDate),

    e16: val("e16"),
    d17: val("d17"),
    e17: val("e17"),
    d18: val("d18"),
    e18: val("e18"),
    d19: val("d19"),
    e19: val("e19"),
    d21: val("d21"),
    d27: val("d27")
  };

  return jsonpPost(GAS_URL, data);
}

function val(id){
  return document.getElementById(id)?.value || "";
}

async function generateSummary(){

  const texts = [
    val("e13"), val("e14"), val("e15"),
    val("e16"), val("e17"), val("e18"), val("e19"),
    val("d21")
  ];

  const joined = texts.filter(t => t).join("\n");

  console.log("送信内容:", joined);

  if(!joined){
    alert("内容がありません");
    return;
  }

  showLoading();

  try{

    const res = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: joined
      })
    });

    const data = await res.json();

    if(data.error){
      throw new Error(data.error);
    }

    document.getElementById("d27").value =
      data.result || "要約に失敗しました";

  }catch(err){

    alert("AI要約エラー\n" + err.message);

  }finally{

    hideLoading();

  }
}