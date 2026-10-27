(function(){'use strict';
const header=document.querySelector('header');if(!header)return;
if(!document.getElementById('mainNav')){
 header.innerHTML='<div class="wrap support-nav"><a class="brand" href="index.html">Habesha Hub</a><nav aria-label="Main navigation"><a href="index.html#directory">Directory</a><a href="daily-tools.html">Daily Life Tools</a><a href="resume.html">Free Resume Builder</a><a href="events.html">Events</a><a href="saved.html">Saved places</a><a href="contact.html">Contact</a></nav><button type="button" class="lang" data-language-toggle>Switch to አማርኛ</button></div>';
 const here=location.pathname.split('/').pop()||'index.html';header.querySelectorAll('nav a').forEach(a=>{if(a.getAttribute('href')===here)a.setAttribute('aria-current','page');});
}
const footer=document.querySelector('footer');if(footer&&!document.getElementById('stateLinksH')){
 const links=document.createElement('nav');links.className='wrap support-footer';links.setAttribute('aria-label','Helpful links');
 // Wrap the links on every page, including pages whose stylesheet has no .support-footer rule (set through the CSSOM; the CSP blocks inline styles).
 Object.assign(links.style,{display:'flex',flexWrap:'wrap',gap:'8px 14px'});
 for(const [text,url] of [['info@habeshahubusa.com','mailto:info@habeshahubusa.com'],['Contact','contact.html'],['Privacy','privacy.html'],['Terms','terms.html'],['Listing Policy','listing-policy.html'],['Accessibility','accessibility.html']]){const a=document.createElement('a');a.textContent=text;a.href=url;links.append(a);}footer.append(links);
}
if(!document.querySelector('.skip')&&document.querySelector('main')){const a=document.createElement('a');a.className='skip';a.href='#'+(document.querySelector('main').id||'main');document.querySelector('main').id ||= 'main';a.textContent='Skip to main content';document.body.prepend(a);}
})();
