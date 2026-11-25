(function(){'use strict';
// Shared header/footer for every page except the homepage.
// The header markup is baked into each page by tools/build-shell.js; this script only
// adds it if a page is missing it, then wires the mobile Menu button.
const up=/\/places\/[^/]*$/.test(location.pathname)?'../':'';
const NAV=[['index.html#directory','Directory'],['index.html#states','Explore states'],['family-hub.html','Family Hub'],['events.html','Events'],['daily-tools.html','Daily Life Tools'],['resume.html','Free Resume Builder'],['saved.html','Saved places'],['contact.html','Contact']];
const body=document.body;body.classList.add('hh-shell');
let header=document.querySelector('header');
if(!header){header=document.createElement('header');body.prepend(header);}
if(!header.querySelector('#shellNav')){
 header.className='hh-header';
 // Static, trusted markup only (no user or data values).
 header.innerHTML='<div class="hh-nav"><a class="brand" href="'+up+'index.html"><span class="mark" aria-hidden="true">ሀ</span>Habesha Hub</a>'+
  '<button class="hh-menu" id="shellMenu" type="button" aria-expanded="false" aria-controls="shellNav">Menu</button>'+
  '<nav id="shellNav" aria-label="Main navigation">'+NAV.map(([h,t])=>'<a href="'+up+h+'">'+t+'</a>').join('')+'<a class="hh-add-m" href="'+up+'submission.html">+ Add a listing</a></nav>'+
  '<button type="button" class="lang" data-language-toggle>Switch to አማርኛ</button>'+
  '<a class="hh-add" href="'+up+'submission.html">Add a listing</a></div>';
 const here=location.pathname.split('/').pop()||'index.html';
 header.querySelectorAll('#shellNav a').forEach(a=>{if(a.getAttribute('href')===here)a.setAttribute('aria-current','page');});
}
const btn=document.getElementById('shellMenu'),nav=document.getElementById('shellNav');
if(btn&&nav){
 const set=open=>{nav.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'Close':'Menu';};
 btn.addEventListener('click',()=>set(!nav.classList.contains('open')));
 nav.addEventListener('click',e=>{if(e.target.closest('a'))set(false);});
 document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!btn.contains(e.target))set(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){set(false);btn.focus();}});
}
const footer=document.querySelector('footer');if(footer&&!document.getElementById('stateLinksH')&&!footer.querySelector('.support-footer')){
 const links=document.createElement('nav');links.className='wrap support-footer';links.setAttribute('aria-label','Helpful links');
 for(const [text,url] of [['info@habeshahubusa.com','mailto:info@habeshahubusa.com'],['Contact',up+'contact.html'],['Privacy',up+'privacy.html'],['Terms',up+'terms.html'],['Listing Policy',up+'listing-policy.html'],['Accessibility',up+'accessibility.html']]){const a=document.createElement('a');a.textContent=text;a.href=url;links.append(a);}footer.append(links);
}
if(!document.querySelector('.skip')&&document.querySelector('main')){const a=document.createElement('a');a.className='skip';a.href='#'+(document.querySelector('main').id||'main');document.querySelector('main').id ||= 'main';a.textContent='Skip to main content';body.prepend(a);}
})();
