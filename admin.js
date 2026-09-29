(function(){
"use strict";
var SUPABASE_URL="https://yfzydixypuronzoeargv.supabase.co";
var SUPABASE_PUBLISHABLE_KEY="sb_publishable_IgrQc77kE1x_vQan5lLUyg_gCGkLdq3";
var client=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
var gate=document.getElementById("adminGate");
var app=document.getElementById("adminApp");

function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
function table(rows,cols){
  if(!rows || !rows.length) return '<div class="admin-box admin-muted">No records yet.</div>';
  return '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'+cols.map(c=>'<th>'+esc(c.label)+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(r[c.key])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
async function count(name){
  var r=await client.from(name).select("*",{count:"exact",head:true});
  return r.count||0;
}
async function load(){
  var sessionRes=await client.auth.getSession();
  var session=sessionRes.data && sessionRes.data.session;
  if(!session){window.location.replace("admin-login.html");return;}
  var p=await client.from("profiles").select("id,full_name,role,status").eq("id",session.user.id).single();
  if(p.error || !p.data || p.data.role!=="admin" || p.data.status!=="active"){
    await client.auth.signOut();
    window.location.replace("admin-login.html");
    return;
  }
  document.getElementById("adminIdentity").textContent=(p.data.full_name||session.user.email)+" · Administrator";
  gate.hidden=true; app.hidden=false;

  var counts=await Promise.all([count("profiles"),count("member_requests"),count("business_claims"),count("event_submissions"),count("reports")]);
  ["statProfiles","statMembers","statBusinesses","statEvents","statReports"].forEach((id,i)=>document.getElementById(id).textContent=counts[i]);

  var data=await Promise.all([
    client.from("profiles").select("full_name,city,state,role,status,created_at").order("created_at",{ascending:false}),
    client.from("member_requests").select("full_name,email,city,state,membership_type,status,created_at").order("created_at",{ascending:false}),
    client.from("business_claims").select("business_name,requester_name,requester_email,status,created_at").order("created_at",{ascending:false}),
    client.from("event_submissions").select("event_name,event_date,city,state,organizer,status,created_at").order("created_at",{ascending:false}),
    client.from("reports").select("report_type,subject,status,created_at").order("created_at",{ascending:false}),
    client.from("admin_resources").select("label,url,resource_type").order("label")
  ]);
  document.getElementById("membersTable").innerHTML=table(data[0].data,[{key:"full_name",label:"Name"},{key:"city",label:"City"},{key:"state",label:"State"},{key:"role",label:"Role"},{key:"status",label:"Status"},{key:"created_at",label:"Created"}]);
  document.getElementById("submissionsTable").innerHTML=table(data[1].data,[{key:"full_name",label:"Name"},{key:"email",label:"Email"},{key:"city",label:"City"},{key:"state",label:"State"},{key:"membership_type",label:"Type"},{key:"status",label:"Status"},{key:"created_at",label:"Created"}]);
  document.getElementById("businessesTable").innerHTML=table(data[2].data,[{key:"business_name",label:"Business"},{key:"requester_name",label:"Requester"},{key:"requester_email",label:"Email"},{key:"status",label:"Status"},{key:"created_at",label:"Created"}]);
  document.getElementById("eventsTable").innerHTML=table(data[3].data,[{key:"event_name",label:"Event"},{key:"event_date",label:"Date"},{key:"city",label:"City"},{key:"state",label:"State"},{key:"organizer",label:"Organizer"},{key:"status",label:"Status"}]);
  document.getElementById("reportsTable").innerHTML=table(data[4].data,[{key:"report_type",label:"Type"},{key:"subject",label:"Subject"},{key:"status",label:"Status"},{key:"created_at",label:"Created"}]);

  var resources=data[5].data||[];
  var forms=document.getElementById("formsTable");
  if(!resources.length){forms.innerHTML='<div class="admin-box admin-muted">No private admin resources configured yet.</div>';}
  else{
    forms.innerHTML='<div class="admin-stats">'+resources.map(function(r){
      var safe=/^https:\/\//i.test(r.url)?r.url:"#";
      return '<div class="admin-box"><strong>'+esc(r.label)+'</strong><p class="admin-muted">'+esc(r.resource_type)+'</p><p><a class="btn secondary" target="_blank" rel="noopener noreferrer" href="'+esc(safe)+'">Open</a></p></div>';
    }).join('')+'</div>';
  }
}
document.querySelectorAll("[data-tab]").forEach(function(b){b.addEventListener("click",function(){
  document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));
  document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));
  document.getElementById("panel-"+b.dataset.tab).classList.add("active");
});});
document.getElementById("adminSignOut").addEventListener("click",async function(){await client.auth.signOut();window.location.replace("admin-login.html");});
load().catch(function(){gate.textContent="Unable to load the secure admin dashboard.";gate.classList.add("admin-danger");});
})();