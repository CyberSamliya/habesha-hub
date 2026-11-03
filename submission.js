(function(){"use strict";
var q=new URLSearchParams(location.search);
// Support links already shared before dedicated inquiry types existed.
if(q.get('type')==='contact'){
 if(q.get('name')==='City or Category Sponsor inquiry'){q.set('type','sponsorship');q.delete('name');}
 if(q.get('name')==='Website and Digital Services inquiry'||q.get('name')==='Business services consultation'){q.set('type','digital');q.delete('name');}
}
var map={sponsorship:"City or Category Sponsor inquiry",digital:"Website & Digital Services quote",add:"Add a business or organization",church:"Add a church",professional:"Add a professional",housing:"Add housing",correction:"Correct a listing",claim:"Claim a listing",closed:"Report closed or moved",scam:"Report a housing scam or safety issue",remove:"Request removal",event:"Submit an event",contact:"General question or contact"};
var FORM="https://docs.google.com/forms/d/e/1FAIpQLSfk9KdeowBKfEt_6edfqKAgMBkuQ9NnJ3jJ4-2lBHf8joMosA/viewform";
var p=new URLSearchParams();
p.set("usp","pp_url");
var type=map[q.get("type")]||"";
if(type)p.set("entry.2143705137",type);
if(q.get("name"))p.set("entry.1710451381",q.get("name").slice(0,120));
if(q.get("city"))p.set("entry.860530315",q.get("city").slice(0,80));
if(q.get("state"))p.set("entry.447872666",q.get("state").slice(0,80));
if(q.get("id"))p.set("entry.1798896994",q.get("id").slice(0,80));
var target=FORM+"?"+p.toString();
var link=document.getElementById("openPrivateForm");
if(link)link.href=target;
var direct=document.getElementById("directForm");if(direct)direct.href=target;
var frame=document.getElementById("privateFormFrame");
if(frame)frame.src=target.replace("/viewform?","/viewform?embedded=true&");
const form=document.getElementById('intakeForm');
if(form){
 const typeField=document.getElementById('intakeType'),nameField=document.getElementById('intakeName'),cityField=document.getElementById('intakeCity'),stateField=document.getElementById('intakeState');
 const states=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
 states.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;stateField.append(o);});
 typeField.value=map[q.get('type')]?q.get('type'):'contact';nameField.value=(q.get('name')||'').slice(0,120);cityField.value=(q.get('city')||'').slice(0,80);stateField.value=q.get('state')||'';
 const byId=id=>document.getElementById(id);
 const business=()=>['sponsorship','digital'].includes(typeField.value);
 const listings=window.HABESHA_LISTINGS||[];
 function cities(){
  byId('intakeCities').replaceChildren();
  const names=[...new Set(listings.filter(l=>l.state===stateField.value&&!['closed','duplicate'].includes(l.status)).flatMap(l=>[l.city,l.metro]).filter(Boolean))].sort();
  names.forEach(name=>{const o=document.createElement('option');o.value=name;byId('intakeCities').append(o);});
  byId('cityHelp').textContent=stateField.value?(names.length?'Choose a suggested city in '+stateField.value+', or type another city.':'No directory city suggestions yet for '+stateField.value+'. Type your city.'):'Choose a state to see cities covered by our directory, or type another city.';
 }
 stateField.addEventListener('change',()=>{cityField.value='';cities();});cities();
 [...new Set(listings.map(l=>l.category).filter(Boolean))].sort().forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;byId('sponsorCategory').append(o);});
 function placement(){const category=typeField.value==='sponsorship'&&byId('sponsorPlacement').value==='category';byId('categoryLabel').hidden=!category;byId('sponsorCategory').required=category;}
 byId('sponsorPlacement').addEventListener('change',placement);
 function mode(){
  const active=business(),sponsor=typeField.value==='sponsorship';
  byId('businessFields').hidden=!active;byId('sponsorFields').hidden=!sponsor;byId('digitalFields').hidden=sponsor||!active;
  for(const id of ['contactName','contactEmail'])byId(id).required=active;
  byId('businessFields').querySelectorAll('input,select').forEach(field=>{field.disabled=!active||(field.closest('#sponsorFields')&&!sponsor)||(field.closest('#digitalFields')&&sponsor);});
  nameField.required=active;stateField.required=active;cityField.required=active;byId('intakeDetails').required=active;
  byId('submissionTitle').textContent=active?(sponsor?'Ask about City or Category Sponsorship':'Request a Website & Digital Services quote'):'Submit, correct or report information';
  byId('submissionIntro').textContent=active?'Tell us about your business and goals. Review your inquiry, then send it through your email app. Nothing is sent automatically.':'Use the private Google Form below. Nothing is published automatically; submissions are reviewed before any directory change.';
  byId('draftInstructions').textContent=active?'Your draft stays on this page until you open an email draft and send it. You can also copy the summary into an email to advertise@habeshahubusa.com.':'Start here in either language. Your draft stays on this page and is not saved or sent. Review and submit in Google Forms when you are ready.';
  byId('privacyNotice').textContent=active?'Private inquiry: Send your request to advertise@habeshahubusa.com. Contact details are used for follow-up. Do not include payment details or sensitive personal information.':"Private intake: Your submission goes to Habesha Hub’s private review form and response sheet. Optional contact information is used only for follow-up.";
  byId('businessIntro').textContent=sponsor?'Introductory sponsorship: $75/month. Choose a city or a category. Placement and availability must be confirmed before payment.':'Website projects start around $399. Tell us what you need; scope and final pricing are confirmed before work begins.';
  byId('intakeDetails').placeholder=active?(sponsor?'Describe your audience, sponsorship goals and preferred duration.':'Describe your business, pages or features needed, and what you want to improve.'):'Describe the change, question or event. Include a public source link if available.';
  byId('googleNotice').hidden=active;byId('directFormDetails').hidden=active;byId('openPrivateForm').hidden=active;byId('emailInquiry').hidden=!active;byId('intakeReview').hidden=true;placement();
 }
 typeField.addEventListener('change',mode);mode();
 form.addEventListener('input',()=>{byId('intakeReview').hidden=true;byId('intakeStatus').textContent='';});
 form.addEventListener('submit' ,e=>{e.preventDefault();const params=new URLSearchParams({usp:'pp_url'});params.set('entry.2143705137',map[typeField.value]);params.set('entry.1710451381',nameField.value);params.set('entry.860530315',cityField.value);params.set('entry.447872666',stateField.value);if(q.get('id'))params.set('entry.1798896994',q.get('id'));
 let summary=[map[typeField.value],nameField.value,cityField.value,stateField.value,document.getElementById('intakeDetails').value].filter(Boolean).join('\n');
 if(business()){
  summary=[typeField.value==='sponsorship'?'City or Category Sponsor inquiry':'Website & Digital Services quote',
   'Business: '+nameField.value,'Contact: '+byId('contactName').value,'Email: '+byId('contactEmail').value,
   'Location: '+cityField.value+', '+stateField.value,'Website: '+(byId('businessWebsite').value||'None provided'),
   ...(typeField.value==='sponsorship'?['Placement: '+byId('sponsorPlacement').value,...(byId('sponsorPlacement').value==='category'?['Category: '+byId('sponsorCategory').value]:[]),'Preferred start: '+(byId('sponsorStart').value||'Flexible')]:['Service: '+byId('digitalService').value,'Budget: '+byId('digitalBudget').value,'Timeline: '+byId('digitalTimeline').value]),
   'Details: '+byId('intakeDetails').value].join('\n');
  byId('emailInquiry').href='mailto:advertise@habeshahubusa.com?subject='+encodeURIComponent((typeField.value==='sponsorship'?'Sponsorship inquiry: ':'Digital services quote: ')+nameField.value)+'&body='+encodeURIComponent(summary);
 }
 byId('reviewInstructions').textContent=business()?'Nothing has been sent. Open the email draft, review it and send it in your email app. If your app does not open or the full summary is missing, copy the summary and email advertise@habeshahubusa.com.':'Nothing has been submitted. Copy the summary into the relevant details field in Google Forms, review your answers and submit there.';
 document.getElementById('intakeSummary').value=summary;document.getElementById('openPrivateForm').href=FORM+'?'+params;document.getElementById('intakeReview').hidden=false;document.getElementById('intakeReview').focus();
 });
 document.getElementById('copyIntake').addEventListener('click',async()=>{const field=document.getElementById('intakeSummary');try{await navigator.clipboard.writeText(field.value);document.getElementById('intakeStatus').textContent=business()?'Summary copied. Paste it into an email to advertise@habeshahubusa.com.':'Summary copied. Paste it into the details field in Google Forms.';}catch{field.focus();field.select();document.getElementById('intakeStatus').textContent=business()?'Select and copy the summary, then email it to advertise@habeshahubusa.com.':'Select and copy the summary, then paste it into Google Forms.';}});
}
})();