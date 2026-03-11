/* ===========================
   GAS URL
=========================== */

const GAS_URL =
"https://script.google.com/macros/s/AKfycbwmIwXShoaka_KnyIy-sv4GWVIkwqRYWO_RFNuv4-jc3Y71bTpxshjlSTY5H07caToLTg/exec";

let currentDate = null;


/* ===========================
   日付形式統一
=========================== */

function normalizeDate(date){
return date.replaceAll("-", "/");
}


/* ===========================
   初期化
=========================== */

document.addEventListener("DOMContentLoaded",()=>{

initDaySelect();
initTeams();
initPlaces();

initCalendar();

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

const date = normalizeDate(info.dateStr);

try{

const res = await fetch(
GAS_URL + "?date=" + encodeURIComponent(date)
);

/* 安全にレスポンス取得 */

const text = await res.text();

if(!text){
alert("データがありません");
return;
}

let data;

try{
data = JSON.parse(text);
}catch(e){
console.error("JSON解析エラー",text);
alert("データ形式エラー");
return;
}

/* シート無し */

if(data.error){
alert("イベントが作成されていません");
return;
}

/* シートありならここで日付入力 */

currentDate = date;

const [y,m,d] = info.dateStr.split("-");

document.getElementById("d3").value = y;
document.getElementById("e3").value = parseInt(m);
document.getElementById("f3").value = parseInt(d);

/* データ反映 */

Object.keys(data).forEach(key=>{

const el = document.getElementById(key);

if(!el) return;

let value = data[key];

if(key==="d3"){ value = value.replace("年",""); }
if(key==="e3"){ value = value.replace("月",""); }
if(key==="f3"){ value = value.replace("日",""); }

el.value = value;

});

updateWeekday();
updateTeamOptions();

}catch(err){

console.error(err);
alert("データ取得エラー");

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
   チームプルダウン
=========================== */

const teamList = ["","T","K","A","I"];

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
   保存
=========================== */

async function saveEvent(){

if(!currentDate){

alert("日付を選択してください");
return;

}

const data = {
date: normalizeDate(currentDate)
};

document
.querySelectorAll(
".event-editor input, .event-editor select, .event-editor textarea"
)
.forEach(el=>{
if(el.id){
data[el.id] = el.value;
}
});

try{

const params = new URLSearchParams(data);

await fetch(
GAS_URL + "?" + params
);

alert("保存しました");

}catch(err){

console.error(err);
alert("保存エラー");

}

}


/* ===========================
   シート作成
=========================== */

async function createSheet(){

let date =
prompt("作成する日付 (例: 2026/04/20)");

if(!date) return;

date =
normalizeDate(date);

try{

const res =
await fetch(
GAS_URL +
"?action=create&date=" +
encodeURIComponent(date)
);

const text =
await res.text();

if(text === "created"){
alert("イベント作成完了");
}else if(text === "exists"){
alert("既に存在します");
}else{
alert(text);
}

}catch(err){

console.error(err);
alert("作成エラー");

}

}