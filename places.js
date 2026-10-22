(function(){'use strict';
const all=(window.HABESHA_LISTINGS||[]).filter(x=>!['closed','duplicate'].includes(x.status)),key='hh-saved-places-v1';
const statuses={verified:'Verified',community:'Community listed','needs-review':'Needs verification','temporarily-closed':'Temporarily closed'};
const E=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
function saved(){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[];}catch{return [];}}
function status(t){document.getElementById('profileStatus').textContent=t;}
function button(text,fn){const b=E('button',text);b.type='button';b.className='btn secondary';b.addEventListener('click',fn);return b;}
function link(text,url){const a=E('a',text);a.href=url;a.className='btn secondary';if(/^https?:/.test(url)){a.rel='noopener noreferrer';a.target='_blank';}return a;}
function url(x){return 'listing.html?id='+encodeURIComponent(x.id);}
function request(type,x){return 'submission.html?'+new URLSearchParams({type,id:x.id,name:x.name,city:x.city,state:x.state});}
function toggle(x,b){try{const a=saved(),exists=a.includes(x.id);localStorage.setItem(key,JSON.stringify(exists?a.filter(id=>id!==x.id):a.concat(x.id)));b.textContent=exists?'Save place':'Remove saved place';b.setAttribute('aria-pressed',String(!exists));status(exists?'Place removed.':'Place saved on this device.');}catch{status('Browser storage is unavailable. Bookmark this page instead.');}}
function profile(x){
 const wrap=document.getElementById('profile');wrap.replaceChildren();
 const back=link('Back to directory','./?state='+encodeURIComponent(x.state)+'#directory');wrap.append(back,E('p',x.city+', '+x.state),E('h1',x.name));
 document.title=x.name+' | Habesha Hub';document.querySelector('link[rel=canonical]').href='https://cybersamliya.github.io/habesha-hub/'+url(x);
 const badge=E('p',statuses[x.status]||'Needs verification');badge.className='badge s-'+x.status;wrap.append(badge);
 const intro=E('p',x.description||x.subcategory||'Community directory listing.');if(x.descriptionAm){intro.dataset.en=x.description;intro.dataset.am=x.descriptionAm;}else intro.lang='en';wrap.append(intro);
 const actions=E('div');actions.className='profile-actions';
 if(x.phone&&x.privacy!=='limited')actions.append(link('Call','tel:+1'+x.phone.replace(/\D/g,'')));
 if(/^https?:\/\//.test(x.website||x.social||''))actions.append(link('Website or contact page',x.website||x.social));
 if(x.address&&x.privacy!=='limited')actions.append(link('Directions','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.name+', '+x.address+', '+x.city+', '+x.state)));
 if(x.profile&&/^[a-z0-9-]+\.html$/.test(x.profile))actions.append(link('Photos & menu',x.profile));
 const save=button(saved().includes(x.id)?'Remove saved place':'Save place',()=>toggle(x,save));save.setAttribute('aria-pressed',String(saved().includes(x.id)));actions.append(save);
 actions.append(button('Copy profile link',async()=>{try{await navigator.clipboard.writeText(location.href);status('Profile link copied.');}catch{status('Copy the address from your browser to share this profile.');}}));wrap.append(actions);
 const grid=E('div');grid.className='profile-grid';
 const visit=E('section');visit.append(E('h2','Plan your visit'));
 if(x.address&&x.privacy!=='limited')visit.append(E('address',x.address+', '+x.city+', '+x.state+' '+(x.zip||'')));
 else visit.append(E('p',x.city+', '+x.state),E('p','Contact the provider for the service location.'));
 const hours=E('p',x.hours||'Hours are not confirmed. Contact the provider before visiting.');if(x.hoursAm){hours.dataset.en=x.hours;hours.dataset.am=x.hoursAm;}visit.append(E('h3','Hours'),hours);
 visit.append(E('h3','Services'));if(x.services?.length){const ul=E('ul');x.services.forEach(s=>ul.append(E('li',s)));visit.append(ul);}else visit.append(E('p','Confirm current services and prices directly with the provider.'));
 visit.append(E('h3','Language support'),E('p',x.languages?.join(', ')||'Language availability is not confirmed. Ask the provider.'));grid.append(visit);
 const trust=E('section');trust.append(E('h2','Sources & verification'),E('p','Last checked: '+(x.detailsChecked||x.verifiedDate||'Not yet checked')));
 trust.append(E('p','Verified means factual directory details were checked. It does not certify licensing, quality, safety or availability.'));
 if(x.publicNote){const note=E('p',x.publicNote);note.lang='en';trust.append(E('h3','Source note (original language)'),note);}
 if(/^https?:\/\//.test(x.source||''))trust.append(link('Primary source',x.source));
 if(/^https?:\/\//.test(x.secondSource||''))trust.append(link('Additional source',x.secondSource));
 trust.append(E('p','Professional licenses and insurance should be checked with the relevant authority before hiring.'));
 grid.append(trust);wrap.append(grid);
 const edit=E('section');edit.append(E('h2','Keep this information accurate'));const row=E('div');row.className='profile-actions';row.append(link('Suggest a correction',request('correction',x)),link('Claim this listing',request('claim',x)),link('Request removal',request('remove',x)));edit.append(row);wrap.append(edit);
 const related=all.filter(y=>y.id!==x.id&&y.category===x.category&&y.state===x.state).slice(0,3);if(related.length){const section=E('section');section.append(E('h2','Related places'));const ul=E('ul');related.forEach(y=>{const li=E('li');li.append(link(y.name,url(y)));ul.append(li);});section.append(ul);wrap.append(section);}
 const schema={'@context':'https://schema.org','@type':'WebPage',name:x.name,url:document.querySelector('link[rel=canonical]').href,about:{'@type':'Organization',name:x.name}};const script=E('script');script.type='application/ld+json';script.textContent=JSON.stringify(schema);document.head.append(script);
}
const target=document.getElementById('profile');if(target){const x=all.find(x=>x.id===new URLSearchParams(location.search).get('id'));if(x)profile(x);else{const meta=document.createElement('meta');meta.name='robots';meta.content='noindex';document.head.append(meta);target.replaceChildren(E('h1','Listing not found'),E('p','This listing may have moved or is no longer published.'),link('Back to directory','index.html#directory'));}}
const bookmarks=document.getElementById('savedPlaces');if(bookmarks){const list=all.filter(x=>saved().includes(x.id));if(!list.length)bookmarks.append(E('p','No saved places yet. Open a business profile and choose Save place.'),link('Browse directory','index.html#directory'));else{const ul=E('ul');list.forEach(x=>{const li=E('li');li.append(link(x.name,url(x)));ul.append(li);});bookmarks.append(ul);}}
})();
