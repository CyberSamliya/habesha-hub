const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.HH_OUTPUT_DIR||path.resolve(root,'../../outputs');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'};
async function run(){
 const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(req.url.split('?')[0].endsWith('/'))f=path.join(f,'index.html');if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'text/plain'});res.end(e?'Not found':b);});}).listen(0,'127.0.0.1');
 await new Promise(r=>server.on('listening',r));const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch(process.env.HH_EDGE?{channel:'msedge'}:{});
 let checks=0;function ok(cond,msg){assert.ok(cond,msg);checks++;console.log('PASS '+msg);}
 try{
 const p=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);
 await p.click('#searchResults');ok((await p.textContent('#resultMeta')).startsWith('326 '),'Search without filters browses all listings');
 await p.click('#clearFilters');await p.selectOption('#dirState','Ohio');
 ok((await p.textContent('#resultMeta')).startsWith('36 '),'Ohio directory has 36 records');
 const rows=await p.evaluate(()=>window.HabeshaHub.rows());let group='',previous=-1;const rank={verified:0,community:1,'needs-review':2,'temporarily-closed':3};
 for(const x of rows){let g=x.metro||x.city;if(g!==group){group=g;previous=-1;}ok(rank[x.status]>=previous,'Verified ordering: '+x.name);previous=rank[x.status];}
 await p.fill('#q','Zoma');await p.click('#searchResults');ok(await p.locator('#directory').evaluate(e=>document.activeElement===e),'Show results focuses the result section');
 await p.waitForFunction(()=>document.querySelector('#directory').getBoundingClientRect().top<180);ok(await p.locator('#directory').evaluate(e=>e.getBoundingClientRect().top<180),'Search moves results into view');
 await p.fill('#q','zzzzzzz');ok((await p.textContent('#listingGrid')).includes('Check the spelling'),'No-match search offers recovery');
 await p.click('#resetResults');ok(await p.inputValue('#q')==='','Reset clears search');
 await p.selectOption('#dirCategory','Home');ok((await p.textContent('#listingGrid')).includes('wider area'),'Empty category offers broader discovery');
 ok((await p.locator('[data-category="Home"] .category-count').textContent()).includes('Help build'),'Empty category labeled before click');
 await p.click('#langBtn');await p.waitForFunction(()=>document.querySelector('#searchResults').textContent.startsWith('ውጤቶችን አሳይ'));
 ok((await p.locator('#mainNav summary').first().textContent()).includes('ያስሱ'),'Navigation translates to Amharic');
 await p.click('#langBtn');ok((await p.locator('#mainNav summary').first().textContent()).includes('Explore'),'Language switches back');
 const all=await p.evaluate(()=>window.HABESHA_LISTINGS.filter(x=>!['closed','duplicate'].includes(x.status)));
 for(const state of new Set(all.map(x=>x.state))){const file=state.toLowerCase().replaceAll(' ','-')+'.html';const text=fs.readFileSync(path.join(root,file),'utf8');ok(text.includes('<p>'+all.filter(x=>x.state===state).length+' listing'),'Generated count matches '+state);}
 await p.goto(url+'/ohio.html');ok((await p.textContent('main')).includes('36 listings'),'Generated Ohio matches directory');
 for(const width of [390,768,1280]){await p.setViewportSize({width,height:850});await p.goto(url+'/?state=Ohio');ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+width);}
 await p.setViewportSize({width:1280,height:850});await p.goto(url+'/?state=Ohio');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'habesha-hub-search-preview.png')});
 await p.goto(url+'/events.html');ok(await p.locator('#upcomingEvents article').count()===0,'Past events not presented as upcoming');ok(await p.locator('#pastEvents article').count()===3,'All original events retained in archive');
 await p.clock.install({time:new Date('2026-10-10T19:00:00Z')});await p.reload();ok(await p.locator('#upcomingEvents article').count()===2,'Event classification respects timezone and end instant');await p.clock.fastForward(2*60*60*1000);ok(await p.locator('#upcomingEvents article').count()===1,'Event moves to archive while page remains open');
 await p.clock.setFixedTime(new Date('2026-10-22T18:00:00Z'));
 await p.goto(url+'/daily-tools.html');const tools=['budget','reminders','grocery','help','phrases','jobs','family','scam','events','requests'];
 for(const key of tools){await p.click('[data-key="'+key+'"]');ok((await p.locator('#toolBody').innerText()).length>70,key+' workspace renders');if(['reminders','grocery','jobs','family','events','requests'].includes(key))ok(await p.locator('#toolBody textarea').count()>0,key+' has textarea form');}
 for(const key of ['reminders','meals','jobs','family','events','requests','budget','grocery']){
  await p.click('[data-key="'+(key==='meals'?'grocery':key)+'"]');
  const f=p.locator('#toolBody form').nth(key==='meals'?1:0);
  for(const input of await f.locator('input,textarea').all()){const type=await input.getAttribute('type');await input.fill(type==='date'?'2026-10-23':type==='month'?'2026-10':type==='number'?'25':'Audit '+key);}
  await f.locator('button[type="submit"]').click();ok(await p.evaluate(k=>JSON.parse(localStorage.getItem('hh-daily-life-v1'))[k].length===1,key),key+' entry saves');
 }
 await p.reload();ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('hh-daily-life-v1')).jobs.length===1),'Saved entries persist after reload');
 const dl=p.waitForEvent('download');await p.click('#exportAll');const download=await dl;ok(download.suggestedFilename()==='habesha-daily-life.json','Planner export downloads JSON');
 await p.click('[data-key="reminders"]');const ics=p.waitForEvent('download');await p.getByText('Download calendar (.ics)',{exact:true}).click();ok((await ics).suggestedFilename().endsWith('.ics'),'Reminders export calendar');
 await p.click('[data-language-toggle]');await p.waitForFunction(()=>document.querySelector('#toolTitle').textContent==='ክፍያዎች እና ማስታወሻዎች');ok((await p.locator('#toolBody label').first().textContent()).includes('ርዕስ'),'Tool form labels translate');
 await p.click('[data-language-toggle]');await p.locator('#toolBody .item button').filter({hasText:'Delete'}).click();ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('hh-daily-life-v1')).reminders.length===0),'Entry deletion works');
 ok(errors.length===0,'No browser JavaScript errors: '+errors.join(';'));
 console.log(checks+' checks passed');
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
