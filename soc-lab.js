(function(){
"use strict";
var SUPABASE_URL="https://yfzydixypuronzoeargv.supabase.co";
var SUPABASE_PUBLISHABLE_KEY="sb_publishable_IgrQc77kE1x_vQan5lLUyg_gCGkLdq3";
var client=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
var gate=document.getElementById("socGate");
var app=document.getElementById("socApp");

async function load(){
  var s=await client.auth.getSession();
  var session=s.data&&s.data.session;
  if(!session){window.location.replace("admin-login.html");return;}
  var p=await client.from("profiles").select("full_name,role,status").eq("id",session.user.id).single();
  if(p.error||!p.data||p.data.role!=="admin"||p.data.status!=="active"){
    await client.auth.signOut();
    window.location.replace("admin-login.html");
    return;
  }
  document.getElementById("socIdentity").textContent=(p.data.full_name||session.user.email)+" · SOC Training";
  gate.classList.add("hidden");
  app.classList.remove("hidden");
}
document.getElementById("socSignOut").addEventListener("click",async function(){
  await client.auth.signOut();
  window.location.replace("admin-login.html");
});
document.getElementById("checkAnswer").addEventListener("click",function(){
  var c=document.getElementById("classification").value;
  var e=document.getElementById("evidence").value.trim();
  var r=document.getElementById("reasoning").value.trim();
  var n=document.getElementById("nextAction").value.trim();
  var f=document.getElementById("feedback");
  f.classList.remove("hidden");
  if(!c||e.length<20||r.length<20||n.length<10){
    f.innerHTML="<strong>Incomplete analysis.</strong><p>Choose a classification and document evidence, reasoning, and a next action before closing an alert.</p>";
    return;
  }
  f.innerHTML="<strong>Good SOC workflow.</strong><p>The strongest observation is that all failed and successful events use the same source IP and user agent in a short time window. That can be consistent with a legitimate user mistyping a password, but a SOC analyst should still validate with the account owner and review surrounding authentication activity before closing it.</p><p><strong>Key lesson:</strong> do not classify only from the alert title. Use evidence and context.</p>";
});
load().catch(function(){gate.innerHTML='<div class="soc-body">Unable to load the secure SOC lab.</div>';});
})();