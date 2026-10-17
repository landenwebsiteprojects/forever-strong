const {chromium}=require(process.env.HE_PLAYWRIGHT||'playwright');const fs=require('fs'),path=require('path');
(async()=>{
 const http=require('http');const webroot=path.resolve(__dirname,'../module/webroot');
 const server=http.createServer((req,res)=>{let file=path.join(webroot,decodeURIComponent(req.url.split('?')[0]));if(req.url.endsWith('/'))file=path.join(file,'index.html');if(!file.startsWith(webroot)){res.writeHead(403);res.end();return;}try{const data=fs.readFileSync(file);res.setHeader('content-type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(8765,'127.0.0.1',r));
 fs.mkdirSync(path.resolve(__dirname,'../../previews'),{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.HE_CHROME,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 await context.route('**/*',route=>{if(route.request().url().startsWith('http://127.0.0.1:8765/'))return route.continue();return route.abort();});
 await context.addInitScript(()=>{
  window.__commands=[];window.ksu={exec:(cmd,opts,cb)=>{
   window.__commands.push(cmd);let out='';
   if(cmd.includes("'engine-status'"))out='owner=halloweenedition\nkind=TrickyStoreOSS\nengine=/data/adb/modules/halloweenedition/tricky\nconfig=/data/adb/tricky_store\ninstalled=1\nenabled=1\nrunning=1\nsupervised=1\nexternal_teesim=0\nexternal_omk=0\n';
   else if(cmd.includes("'repair'"))out='Repair workflow completed. No integrity verdict was measured.';
   else if(cmd.includes("'status'"))out='version=v1.0\ndevice=Android test fixture\nandroid=14\nabi=arm64-v8a\nselinux=Enforcing\nroot=Kitsune 30.6 (fixture)\nintegrity=boot hooks completed\nzygisk=installed; loader must be checked on device\ntricky=process present; interception unverified\ntargets=3\nkeybox=present\ntee=teeBroken=false\nprofile=pixelify\n';
   else if(cmd.includes("'read' 'targets'"))out='com.google.android.gms\ncom.example.leaf?\ncom.example.generate!\n';
   else if(cmd.includes("'read' 'patch'"))out='all=2026-10-05\n';
   else if(cmd.includes("'flags'"))out='safemode=1\nhalloween-auto-targets=0\nhalloween-auto-patch=0\n';
   else if(cmd.includes("'backups'"))out='20261016-123456-123\n';
   else if(cmd.includes('pm list packages'))out='package:com.example.fixture\npackage:com.google.android.gms\n';
   else if(cmd.includes('custom.pif.prop')&&cmd.includes('cat '))out='MODEL=Test Device\nspoofBuild=1\nspoofProps=1\nspoofProvider=1\n';
   else if(cmd.includes("'diagnostics'"))out='Halloween Edition v1.0 — sanitized diagnostics\nNo verdict was measured.';
   else if(cmd.includes("'backup'"))out='20261016-123456-123';
   else if(cmd.includes("'write'"))out='Saved';
   else if(cmd.includes("'validate'"))out='Configuration validation passed';
   else if(cmd.includes('echo ')&&!cmd.includes('getprop'))out='0\n';
   setTimeout(()=>window[cb]?.(0,out,''),5);
  }};
 });
 const page=await context.newPage(),errors=[],results=[];page.on('pageerror',e=>{if(e.message!=='Operation canceled')errors.push(e.message)});
 await page.goto('http://127.0.0.1:8765/');await page.waitForSelector('.notice.connected');
 await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-DESKTOP-TEST-FIXTURE.png'),fullPage:true});
 results.push({test:'Dashboard root bridge, status hydration and navigation',result:'PASS'});
 await page.click('[data-page=tricky]');await page.fill('#package-name','com.test.application');await page.selectOption('#package-mode','!');await page.click('#add-package');if(!(await page.inputValue('#config-text')).includes('com.test.application!'))throw Error('Target draft update failed');
 await page.click('#save-config');await page.click('#accept-confirm');await page.waitForTimeout(100);
 await page.click('[data-config=patch]');await page.waitForTimeout(80);if(!(await page.inputValue('#config-text')).includes('all='))throw Error('Patch read failed');
 await page.click('[data-config=backups]');await page.waitForTimeout(80);if(await page.locator('#backup-list option').count()<2)throw Error('Backup list failed');
 results.push({test:'Target draft modes, save confirmation, patch editor and recovery navigation',result:'PASS'});
 await page.click('[data-page=diagnostics]');await page.click('#check-health');await page.waitForTimeout(80);if(!(await page.textContent('#health-output')).includes('sanitized'))throw Error('Diagnostics UI failed');
 await page.click('[data-page=settings]');await page.waitForTimeout(80);if(!await page.isChecked('[data-flag=safemode]'))throw Error('Flag reporting failed');
 results.push({test:'Diagnostics and persistent flag reporting',result:'PASS'});
 const names=await page.evaluate(()=>toolDefinitions.map(x=>x[0]));
 for(const name of names){const before=errors.length;await page.evaluate(id=>openTool(id),name);await page.waitForTimeout(name==='RepairMode'?1200:200);const frame=page.frames().find(f=>f.url().includes('/'+name+'/'));if(!frame)throw Error('Missing frame '+name);
  const bindingErrors=await frame.evaluate(()=>[...document.querySelectorAll('[onclick],[onchange]')].filter(e=>e.hasAttribute('onclick')&&typeof e.onclick!=='function').map(e=>e.getAttribute('onclick')));
  if(bindingErrors.length)throw Error('Invalid inline bindings: '+name);
  const hidden=await frame.locator('.he-component-header').count();const width=await frame.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,text:document.body.innerText}));
  results.push({test:'Component load: '+name,result:hidden&&errors.length===before?'PASS':'FAIL',errors:errors.slice(before),overflow:width.scroll>width.client+4});
  if(name==='Control')await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-CONTROL-TEST-FIXTURE.png')});
  if(await page.locator('#confirm-dialog[open]').count())await page.click('#cancel-confirm');
 }
 await page.evaluate(()=>openTool('RepairMode'));await page.waitForTimeout(150);
 const repair=page.frames().find(f=>f.url().includes('/RepairMode/'));
 if(!await repair.locator('#repair-button').isEnabled())throw Error('Bundled repair incorrectly unavailable');
 await repair.click('#repair-button');await page.click('#accept-confirm');
 await repair.waitForFunction(()=>document.getElementById('repair-status').textContent.startsWith('Repair workflow completed'));
 const routed=await page.evaluate(()=>window.__commands);
 if(!routed.some(cmd=>cmd.includes("'repair'")))throw Error('Repair did not route to unified controller');
 if(routed.some(cmd=>cmd.includes('/modules/tricky_store/service.sh')))throw Error('Stale standalone repair path executed');
 results.push({test:'Repair button detects bundled OSS without standalone module and routes to unified repair backend',result:'PASS'});
 await page.evaluate(()=>openTool('TrickyStore'));await page.waitForTimeout(100);
 const scope=page.frames().find(f=>f.url().includes('/TrickyStore/'));
 const preserved=await scope.evaluate(()=>{normalizeTargets(['com.example.leaf?','com.example.generate!','com.example.auto']);targetSet=new Set(['com.example.leaf','com.example.generate','com.example.auto','com.example.new']);return targetsForWrite();});
 if(!preserved.includes('com.example.leaf?')||!preserved.includes('com.example.generate!')||!preserved.includes('com.example.auto'))throw Error('Scope editor lost explicit modes');
 results.push({test:'Alternate scope editor preserves leaf/generation/automatic target modes',result:'PASS'});
 await page.evaluate(()=>navigate('dashboard'));await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-MOBILE-TEST-FIXTURE.png'),fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile overflow');
 results.push({test:'390px mobile layout without horizontal overflow',result:'PASS'});
 // Reproduce the reported small-screen bugs in every retained control, not only the dashboard.
 for(const width of [320,390,480]){
  await page.setViewportSize({width,height:844});
  for(const name of names){
   await page.evaluate(id=>openTool(id),name);
   await page.waitForFunction(id=>{const iframe=document.getElementById('tool-frame');try{return iframe.contentDocument?.readyState==='complete'&&iframe.contentWindow.location.pathname.includes('/'+id+'/');}catch{return false;}},name);
   await page.waitForTimeout(150);
   const frame=page.frames().find(f=>f.url().includes('/'+name+'/'));
   const geometry=await frame.evaluate(()=>{
    const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
    const escaped=[];
    for(const row of document.querySelectorAll('.row')){
     if(!visible(row))continue;const r=row.getBoundingClientRect();
     for(const child of row.children){if(!visible(child))continue;const c=child.getBoundingClientRect();if(c.left<r.left-2||c.right>r.right+2)escaped.push(child.className);}
    }
    return {overflow:document.documentElement.scrollWidth>innerWidth+2,escaped};
   });
   if(geometry.overflow||geometry.escaped.length)throw Error(`Layout ${name} at ${width}px: ${JSON.stringify(geometry)}`);
   if(await page.locator('#confirm-dialog[open]').count())await page.click('#cancel-confirm');
  }
  results.push({test:`All 20 controls at ${width}px: no page overflow or property-row children outside cards`,result:'PASS'});
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>openTool('PropSpoofer'));await page.waitForTimeout(200);
 const props=page.frames().find(f=>f.url().includes('/PropSpoofer/'));
 const search=await props.evaluate(()=>{const box=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,cy:(r.top+r.bottom)/2};};return {icon:box(document.querySelector('.universal-search-icon')),field:box(document.getElementById('universalSearchInput')),clear:box(document.querySelector('.universal-search-clear'))};});
 if(search.icon.right>search.field.left||search.field.right>search.clear.left||Math.abs(search.icon.cy-search.clear.cy)>2)throw Error('Search icon/input/clear alignment failed');
 await props.fill('#universalSearchInput','ro.system.build.fingerprint');await props.click('.universal-search-clear');if(await props.inputValue('#universalSearchInput')!=='')throw Error('Clear search action failed');
 const rows=await props.evaluate(()=>[...document.querySelectorAll('.duck-row:not(.search-live-row)')].map(row=>{const box=e=>e.getBoundingClientRect();const a=box(row.querySelector('[data-action=delete]')),b=box(row.querySelector('[data-action=reset]'));return Math.abs(a.top-b.top)<1&&Math.abs(a.height-b.height)<1;}));
 if(!rows.length||rows.some(result=>!result))throw Error('Nuke/Spoof action rows are not aligned');
 await props.evaluate(()=>{document.querySelector('.duck-main-content .title').textContent='persist.sys.an.extremely.long.property.name.that.must.wrap.without.pushing.the.switch.outside.the.card';});
 const contained=await props.evaluate(()=>{const row=document.querySelector('.duck-row'),r=row.getBoundingClientRect();return [...row.children].every(child=>{const c=child.getBoundingClientRect();return c.left>=r.left&&c.right<=r.right;});});if(!contained)throw Error('Long property name displaced controls');
 await props.evaluate(()=>{document.getElementById('safeModeBanner').style.display='flex';});
 await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-PROPERTIES-MOBILE-TEST-FIXTURE.png'),fullPage:true});
 await props.locator('.duck-row').first().scrollIntoViewIfNeeded();
 await props.locator('.duck-row').first().locator('[data-action=reset]').click();
 if(await props.locator('.duck-row').first().locator('.duck-action-segment').getAttribute('data-action')!=='reset')throw Error('Spoof action selection failed');
 await props.locator('.duck-row').first().locator('[data-action=delete]').click();
 if(await props.locator('.duck-row').first().locator('.duck-action-segment').getAttribute('data-action')!=='delete')throw Error('Nuke action selection failed');
 const selected=await props.locator('.duck-row').first().locator('input').isChecked();await props.locator('.duck-row').first().locator('.duck-switch-wrap').click();if(await props.locator('.duck-row').first().locator('input').isChecked()===selected)throw Error('Property switch no longer toggles');
 await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-PROPERTY-ROWS-MOBILE-TEST-FIXTURE.png'),fullPage:true});
 results.push({test:'Search icon/input/X share a row, clear action works, Nuke/Spoof align, long labels wrap',result:'PASS'});
 await page.evaluate(()=>navigate('settings'));await page.click('[data-theme="#ad8bfa"]');await page.reload();await page.waitForSelector('.notice.connected');
 if(await page.evaluate(()=>fsTheme.read().accent)!=='#ad8bfa')throw Error('Theme did not survive reload');
 await page.evaluate(()=>openTool('PropSpoofer'));await page.waitForTimeout(180);
 const themed=page.frames().find(f=>f.url().includes('/PropSpoofer/'));
 if((await themed.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent'))).trim()!=='#ad8bfa')throw Error('Theme did not reach embedded tool');
 await page.evaluate(()=>navigate('settings'));await page.click('#reset-appearance');
 if(await page.inputValue('#theme-background')!=='#151515'||await page.inputValue('#theme-accent')!=='#ff7900')throw Error('Theme reset failed');
 const resetGap=await page.locator('#reset-appearance').evaluate(button=>button.getBoundingClientRect().top-document.getElementById('reduce-motion').closest('label').getBoundingClientRect().bottom);if(resetGap<16)throw Error('Restore appearance button crowds Reduce motion');
 await page.locator('#reset-appearance').scrollIntoViewIfNeeded();await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-SETTINGS-MOBILE-TEST-FIXTURE.png'),fullPage:true});
 results.push({test:'Theme color preset persists across reload, reaches embedded pages and resets correctly',result:'PASS'});
 await page.evaluate(()=>navigate('dashboard'));if(!(await page.textContent('.release-tag')).includes('HALLOWEEN EDITION'))throw Error('Edition badge missing');
 if(!(await page.textContent('#dashboard h1')).includes('One module.'))throw Error('Updated headline missing');
 if(!await page.locator('.dashboard-backdrop').evaluate(img=>img.complete&&img.naturalWidth>0))throw Error('Dashboard backdrop did not load');
 await page.screenshot({path:path.resolve(__dirname,'../../previews/UI-FOREVER-STRONG-MOBILE-TEST-FIXTURE.png'),fullPage:true});
 results.push({test:'ForeverStrong headline, Halloween Edition badge and locally bundled dashboard backdrop',result:'PASS'});
 const perAppLayouts=[];
 for(const width of [320,390,480,720]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>openTool('Pixel'));await page.waitForTimeout(180);
  const pixel=page.frames().find(f=>f.url().includes('/Pixel/'));
  await pixel.evaluate(()=>{
   zygiskExists=true;document.getElementById('lockedOverlay').classList.remove('show');
   cachedApps=[{pkg:'com.example.alpha',label:'Example Alpha'},{pkg:'com.example.long.application.package.name',label:'An application with a long readable name'},{pkg:'com.example.literal',label:'<img src=x onerror=alert(1)>'}];
   sortAndRender(cachedApps,['com.example.alpha']);
  });
  const layout=await pixel.evaluate(()=>{
   const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   const buttons=[...document.querySelectorAll('.apps-toolbar button')];
   const items=[...document.querySelectorAll('#list>.item')];
   return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.apps-toolbar')).gridTemplateColumns.split(' ').length,buttons:buttons.map(e=>({...box(e),nowrap:getComputedStyle(e).whiteSpace==='nowrap',overflow:e.scrollWidth>e.clientWidth+1})),items:items.map(box),nameHeights:[...document.querySelectorAll('#list .name')].map(e=>e.getBoundingClientRect().height),literal:[...document.querySelectorAll('#list .name')].some(e=>e.textContent.startsWith('<img')),injected:document.querySelectorAll('#list .name img').length};
  });
  if(layout.scroll>layout.viewport+1||layout.buttons.some(b=>b.width<85||!b.nowrap||b.overflow)||layout.nameHeights.some(h=>h>80))throw Error('Per-app controls squeeze text at '+width+': '+JSON.stringify(layout));
  if(layout.items.some((r,i)=>i&&(r.y<=layout.items[i-1].y||Math.abs(r.x-layout.items[0].x)>1||Math.abs(r.width-layout.items[0].width)>1)))throw Error('App list is not full-width vertical rows at '+width);
  if(!layout.literal||layout.injected)throw Error('App labels must render as text');
  if(width===390)await pixel.locator('body').screenshot({path:path.resolve(__dirname,'../../previews/UI-PER-APP-SPOOFING-MOBILE-TEST-FIXTURE.png')});
  perAppLayouts.push({width,frameWidth:layout.viewport,columns:layout.columns,buttonWidths:layout.buttons.map(b=>b.width),rowWidths:layout.items.map(r=>r.width)});
 }
 results.push({test:'Per-app spoofing toolbar labels remain horizontal and app entries occupy separate full-width rows at 320, 390, 480 and 720px',result:'PASS',layouts:perAppLayouts});
 fs.writeFileSync(path.resolve(__dirname,'../docs/UI-TEST-RESULTS.json'),JSON.stringify({results,errors,note:'Mock root bridge; no Android operations executed. Control clicks and native behavior require device tests.'},null,2)+'\n');
 console.log(JSON.stringify({results,errors},null,2));await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
