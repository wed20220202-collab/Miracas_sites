import { auth } from "./firebase.js";
import { isAdmin } from "./admin.js";

auth.onAuthStateChanged(user=>{

  if(!user){
    location.href="index.html";
    return;
  }

  if(!isAdmin(user.email)){
    location.href="home.html";
  }

});