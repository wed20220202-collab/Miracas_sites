import { db } from "./firebase.js";
import {
  doc, getDoc, setDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// UID生成（固定）
function getUID(){
  let uid = localStorage.getItem("uid");
  if(!uid){
    uid = crypto.randomUUID();
    localStorage.setItem("uid", uid);
  }
  return uid;
}

async function join(){

  const uid = getUID();
  const ref = doc(db, "users", uid);

  const snap = await getDoc(ref);

  // すでに番号あり
  if(snap.exists()){
    document.getElementById("number").innerText = snap.data().number;
    return;
  }

  // ランダム番号生成
  const all = await getDocs(collection(db, "users"));
  const used = all.docs.map(d => d.data().number);

  let num;
  do{
    num = Math.floor(Math.random()*9000)+1000;
  }while(used.includes(num));

  await setDoc(ref,{
    number:num,
    created:new Date()
  });

  document.getElementById("number").innerText = num;
}

// 🔥 必ず一番最後
window.join = join;