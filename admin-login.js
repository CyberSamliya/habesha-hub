(function(){
  "use strict";
  var SUPABASE_URL="https://yfzydixypuronzoeargv.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY="sb_publishable_IgrQc77kE1x_vQan5lLUyg_gCGkLdq3";
  var client=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  var form=document.getElementById("adminLoginForm");
  var msg=document.getElementById("adminLoginMessage");

  async function verifyAdminAndRedirect(){
    var sessionResult=await client.auth.getSession();
    var session=sessionResult.data && sessionResult.data.session;
    if(!session) return false;
    var profile=await client.from("profiles").select("role,status").eq("id",session.user.id).single();
    if(profile.error || !profile.data || profile.data.role!=="admin" || profile.data.status!=="active"){
      await client.auth.signOut();
      msg.textContent="This account is not authorized for Habesha Hub administration.";
      return false;
    }
    window.location.replace("admin.html");
    return true;
  }

  verifyAdminAndRedirect();

  form.addEventListener("submit",async function(e){
    e.preventDefault();
    msg.textContent="";
    var email=document.getElementById("adminEmail").value.trim();
    var password=document.getElementById("adminPassword").value;
    var result=await client.auth.signInWithPassword({email:email,password:password});
    if(result.error){
      msg.textContent="Sign-in failed. Check your email and password.";
      return;
    }
    await verifyAdminAndRedirect();
  });
})();