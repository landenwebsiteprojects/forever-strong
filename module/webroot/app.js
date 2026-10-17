'use strict';
const ROOT=heIntegration.root;
const nativeAPI=window.ksu||window.kernelsu;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const quote=s=>"'"+String(s).replace(/'/g,"'\\''")+"'";
const encode=s=>btoa(Array.from(new TextEncoder().encode(s),x=>String.fromCharCode(x)).join(''));
let activePage='dashboard',lastPage='integrity',currentConfig='targets',selectedKeybox='',lastReport='',busy=false,confirmResolve;
function notify(message,error=false){const n=$('#toast');n.textContent=String(message);n.classList.toggle('error',error);n.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.hidden=true,error?9000:4500);}
function confirmOperation(message,title='Continue with this operation?'){
 if(confirmResolve)return Promise.resolve(false);
 $('#confirm-title').textContent=title;$('#confirm-message').textContent=message;
 const d=$('#confirm-dialog');d.showModal();
 return new Promise(resolve=>{confirmResolve=answer=>{d.close();confirmResolve=null;resolve(answer);};});
}
$('#cancel-confirm').onclick=()=>confirmResolve?.(false);$('#accept-confirm').onclick=()=>confirmResolve?.(true);$('#confirm-dialog').oncancel=e=>{e.preventDefault();confirmResolve?.(false);};
function nativeShell(command,timeout=45000){
 command='. '+quote(ROOT+'/bin/root-compat.sh')+'; he_setup_runtime; '+command;
 if(!nativeAPI?.exec)return Promise.reject(new Error('Root shell unavailable. Open this module in KsuWebUIStandalone or WebUI X and grant root access.'));
 return new Promise((resolve,reject)=>{
  const callback='he_'+Date.now()+'_'+Math.random().toString(36).slice(2);let done=false;
  const finish=(ok,out)=>{if(done)return;done=true;clearTimeout(timer);delete window[callback];ok?resolve(String(out??'')):reject(new Error(String(out||'Command failed')));};
  const timer=setTimeout(()=>finish(false,'Operation timed out; it may still be running. Check status before retrying.'),timeout);
  window[callback]=(code,out,err)=>finish(Number(code)===0,Number(code)===0?out:err||out||`Exit status ${code}`);
  try{const r=nativeAPI.exec(command,'{}',callback);if(r?.then)r.then(value=>{if(typeof value==='object'&&value!==null){const code=value.errno??value.code??0;finish(Number(code)===0,Number(code)===0?value.stdout:value.stderr||value.stdout);}else finish(true,value);},e=>finish(false,e.message));}
  catch(e){finish(false,e.message);}
 });
}
function control(op,...args){return nativeShell(['sh',quote(ROOT+'/bin/control.sh'),quote(op),...args.map(quote)].join(' '),['action','repair'].includes(op)?300000:45000);}
window.heEngine=(operation,...args)=>control('engine-'+operation,...args);
window.heRepair=()=>control('repair');
window.confirmOperation=confirmOperation;
// Retained components use this single bridge; destructive shell commands are visible and confirmed.
async function runShell(cmd){
 if(/(?:\bpm\s+clear\b|\brm\s+[^\n;]*(?:-r|-f)|\breboot\b|\bsetenforce\b|\b(?:kill|pkill|killall)\b|\bmv\b|\btouch\b[^\n;]*\/remove\b)/.test(cmd)){
  if(!await confirmOperation('This control will change or remove data, alter device state, or restart processes. Review the command before continuing:\n\n'+cmd,'Apply device changes?'))throw new Error('Operation canceled');
 }
 try{return await nativeShell(cmd,180000);}catch(e){notify(e.message,true);throw e;}
}
window.runShell=runShell;window.runShellFromIframe=runShell;
// Host API facade for v44 pages that store callbacks in their parent window.
window.ksu={exec:(cmd,opts,cb)=>{const p=runShell(cmd);if(cb){p.then(out=>window[cb]?.(0,out,''),e=>window[cb]?.(1,'',e.message));return;}return p;},toast:notify};
window.toast=notify;
const toolDefinitions=[
 ['Profile','Profiles','Device profiles and fingerprint workflow','tune'],['PlayIntegrityFork','PIF engine','Native flags and fingerprint fields','shield'],['PropSpoofer','Device properties','Search, apply and inspect property operations','memory'],['Pixel','Per-app spoofing','Application identities and app profile rules','phone_android'],['Control','ROM controls','Built-in spoofing and Google service properties','settings_suggest'],['Flags','Advanced flags','The complete v44 feature switchboard','flag'],['BootHash','Boot hash','Digest configuration and boot image tools','fingerprint'],['Spoofing','Spoofing options','Existing ROM and signal options','auto_fix_high'],['Pilot','Automatic updates','Assistant automation and action preferences','schedule'],['KeyboxLoader','Keybox scanner','Scan and load XML from supported locations','folder_open'],['KeyboxSource','Keybox sources','Configure source and destination handling','key'],['HideMyFiles','File visibility','Existing file hiding and restore operations','visibility'],['RepairMode','Repair center','Retained upstream repair operations','build'],['RootImplementation','Root setup','Root implementation selection and diagnosis','developer_board'],['Downloader','Downloads','Optional upstream tools and downloads','download'],['Assistant','Assistant','Local guidance and troubleshooting','help_outline'],['TrickyStore','Scope & blacklist','Retained app selection and blacklist tools','apps'],['Support','Translation credits','Upstream translation contributors and links','translate'],['Report','Support & reports','Upstream support links and sanitized diagnostics','feedback'],['BootConfiguration','Boot configuration','First-boot behavior and settings','power_settings_new']
];
function renderTools(){const filter=$('#tool-search').value.toLowerCase();$('#tools').replaceChildren();for(const [id,title,description,icon]of toolDefinitions){if(!(title+' '+description).toLowerCase().includes(filter))continue;const b=document.createElement('button');b.className='tool-tile';const i=document.createElement('span');i.className='material-icons';i.textContent=icon;const strong=document.createElement('strong');strong.textContent=title;const small=document.createElement('small');small.textContent=description;b.append(i,strong,small);b.onclick=()=>openTool(id);$('#tools').append(b);}}
function navigate(page){if(!$('#'+page)?.classList.contains('page'))page='dashboard';activePage=page;$$('.page').forEach(e=>e.classList.toggle('active',e.id===page));$$('#navigation button').forEach(e=>e.classList.toggle('selected',e.dataset.page===page));$('#breadcrumb').textContent='CONTROL ROOM / '+page.toUpperCase();if(page!=='workspace'){$('#tool-frame').src='about:blank';lastPage=page;}window.scrollTo(0,0);if(page==='settings')loadFlags().catch(e=>notify(e.message,true));if(page==='tricky')loadConfig(currentConfig).catch(e=>notify(e.message,true));}
function openTool(id){if(!toolDefinitions.some(t=>t[0]===id)&&id!=='Credits')return;const title=toolDefinitions.find(t=>t[0]===id)?.[1]||'Licenses & credits';$('#tool-title').textContent=title;$('#tool-frame').title=title;navigate('workspace');$('#tool-frame').src=id+'/index.html';}
$$('[data-go]').forEach(b=>b.onclick=()=>navigate(b.dataset.go));$$('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open));$$('#navigation button').forEach(b=>b.onclick=()=>navigate(b.dataset.page));$('#close-tool').onclick=()=>navigate(lastPage);$('#reload-tool').onclick=()=>$('#tool-frame').contentWindow.location.reload();$('#tool-search').oninput=renderTools;
async function refresh(){try{const output=await control('status');const status={};for(const line of output.trim().split('\n')){const pos=line.indexOf('=');if(pos>0)status[line.slice(0,pos)]=line.slice(pos+1);}$$('[data-status]').forEach(e=>e.textContent=status[e.dataset.status]||'Not configured');$('#connection').textContent='Root bridge connected. Device operations are available.';$('#connection').classList.add('connected');$('#updated').textContent='Updated '+new Date().toLocaleTimeString();}catch(e){$('#connection').textContent=e.message;$('#connection').classList.remove('connected');throw e;}}
$('#refresh').onclick=()=>task(refresh,$('#refresh'));
async function task(fn,button){if(busy){notify('An operation is already running.');return;}busy=true;if(button)button.disabled=true;try{return await fn();}catch(e){notify(e.message||e,true);}finally{busy=false;if(button)button.disabled=false;}}
function parseTargets(){return $('#config-text').value.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));}
function renderTargets(){const target=$('#target-list');target.replaceChildren();for(const line of parseTargets()){const row=document.createElement('div');row.className='target-row';const code=document.createElement('code');code.textContent=line;const remove=document.createElement('button');remove.textContent='Remove';remove.onclick=()=>{const lines=$('#config-text').value.split(/\r?\n/);$('#config-text').value=lines.filter(x=>x.trim()!==line).join('\n');renderTargets();notify('Removed from draft. Save configuration to apply.');};row.append(code,remove);target.append(row);}}
async function loadConfig(kind){currentConfig=kind;$$('[data-config]').forEach(b=>b.classList.toggle('selected',b.dataset.config===kind));$('#target-controls').hidden=kind!=='targets';$('#patch-help').hidden=kind!=='patch';$('#text-editor').hidden=!['targets','patch'].includes(kind);$('#keybox-controls').hidden=kind!=='keybox';$('#recovery-controls').hidden=kind!=='backups';if(['targets','patch'].includes(kind)){$('#config-text').value=await control('read',kind);if(kind==='targets')renderTargets();}else if(kind==='backups')await loadBackups();}
$$('[data-config]').forEach(b=>b.onclick=()=>task(()=>loadConfig(b.dataset.config),b));$('#config-text').oninput=()=>{if(currentConfig==='targets')renderTargets();};
$('#add-package').onclick=()=>{const pkg=$('#package-name').value.trim(),mode=$('#package-mode').value;if(!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)+$/.test(pkg)){notify('Enter a valid Android package name.',true);return;}const rows=$('#config-text').value.split(/\r?\n/).filter(x=>x.trim().replace(/[!?]$/,'')!==pkg);rows.push(pkg+mode);$('#config-text').value=rows.filter(Boolean).join('\n')+'\n';renderTargets();notify('Draft updated. Save configuration to apply.');};
$('#validate-config').onclick=e=>task(async()=>notify(await control('validate',currentConfig,encode($('#config-text').value))),e.currentTarget);
$('#save-config').onclick=e=>task(async()=>{if(!await confirmOperation('Save '+currentConfig+' configuration? A secure backup will be created first.'))return;notify(await control('write',currentConfig,encode($('#config-text').value)));await refresh();},e.currentTarget);
$('#reload-config').onclick=e=>task(async()=>{if(await confirmOperation('Discard the editor draft and reload the saved file?'))await loadConfig(currentConfig);},e.currentTarget);
let packages=[];
function renderPackages(){const q=$('#installed-search').value.toLowerCase(),p=$('#installed-packages');p.replaceChildren();for(const pkg of packages.filter(x=>x.toLowerCase().includes(q)).slice(0,80)){const b=document.createElement('button');b.textContent=pkg;b.onclick=()=>{$('#package-name').value=pkg;$('#package-name').focus();};p.append(b);}}
$('#installed-search').oninput=renderPackages;$('#load-packages').onclick=e=>task(async()=>{packages=(await nativeShell('pm list packages')).split('\n').filter(x=>x.startsWith('package:')).map(x=>x.slice(8).trim()).sort();renderPackages();},e.currentTarget);
$('#keybox-file').onchange=async e=>{selectedKeybox='';const file=e.target.files[0];if(!file)return;if(file.size>1048576){notify('Keybox exceeds 1 MiB.',true);return;}selectedKeybox=await file.text();notify('Selected keybox held in memory. It is not displayed or logged.');};
$('#validate-keybox').onclick=e=>task(async()=>{if(!selectedKeybox)throw new Error('Select a keybox XML file first.');notify(await control('validate','keybox',encode(selectedKeybox)));},e.currentTarget);
$('#import-keybox').onclick=e=>task(async()=>{if(!selectedKeybox)throw new Error('Select a keybox XML file first.');if(!await confirmOperation('Replace the current private keybox with the selected XML? A root-only backup will be created first.','Import keybox?'))return;notify(await control('write','keybox',encode(selectedKeybox)));selectedKeybox='';$('#keybox-file').value='';await refresh();},e.currentTarget);
async function loadBackups(){const select=$('#backup-list');select.replaceChildren(new Option('Select a recovery snapshot',''));const ids=(await control('backups')).trim().split('\n').filter(Boolean).reverse();ids.forEach(id=>select.add(new Option(id,id)));}
async function createBackup(){const id=(await control('backup')).trim();notify('Secure backup created: '+id);if(activePage==='tricky')await loadBackups();}
$('#create-backup').onclick=e=>task(createBackup,e.currentTarget);$('#quick-backup').onclick=e=>task(createBackup,e.currentTarget);$('#refresh-backups').onclick=e=>task(loadBackups,e.currentTarget);
$('#restore-backup').onclick=e=>task(async()=>{const id=$('#backup-list').value;if(!id)throw new Error('Select a snapshot.');if(!await confirmOperation('Restore configuration from '+id+'? Current configuration will be backed up first. Reboot after restoring.','Restore snapshot?'))return;notify(await control('restore',id));await refresh();},e.currentTarget);
$('#check-health').onclick=e=>task(async()=>{lastReport=await control('diagnostics');$('#health-output').textContent=lastReport;},e.currentTarget);
$('#export-health').onclick=e=>task(async()=>{if(!lastReport)lastReport=await control('diagnostics');const name='ForeverStrong-diagnostics-'+new Date().toISOString().replace(/[:.]/g,'-')+'.txt';const path='/sdcard/Download/'+name;await nativeShell('mkdir -p /sdcard/Download && printf %s '+quote(encode(lastReport))+' | base64 -d > '+quote(path));notify('Sanitized report saved to Download/'+name);},e.currentTarget);
$('#init-status').onclick=e=>task(async()=>{$('#init-output').textContent=await nativeShell('for f in early.exit hash.exit lineage.exit prop.exit integrity-service.exit tricky.error; do printf "\\n%s: " "$f"; if [ -f /data/adb/halloweenedition/"$f" ]; then head -c 500 /data/adb/halloweenedition/"$f"; else echo "not yet recorded"; fi; done');},e.currentTarget);
async function loadFlags(){const values=await control('flags');$$('[data-flag]').forEach(i=>i.checked=values.split('\n').includes(i.dataset.flag+'=1'));}
$$('[data-flag]').forEach(input=>input.onchange=()=>task(async()=>{const value=input.checked?'1':'0';input.checked=!input.checked;if(!await confirmOperation('Change '+input.dataset.flag+'? Enabling automatic regeneration permits the original action to replace custom configuration.'))return;notify(await control('flag',input.dataset.flag,value));await loadFlags();},input));
$('#run-action').onclick=e=>task(async()=>{if(!await confirmOperation('Run the retained Integrity Box workflow? It may contact upstream download sources and restart Google services. Existing targets and patches are retained unless automatic replacement was enabled.','Run update action?'))return;const out=await control('action');notify('Integrity Box action completed. See Diagnostics for current state.');$('#health-output').textContent=out.slice(-16000);await refresh();},e.currentTarget);
$('#reduce-motion').checked=localStorage.getItem('he-reduce-motion')==='1';document.body.classList.toggle('reduce-motion',$('#reduce-motion').checked);$('#reduce-motion').onchange=e=>{localStorage.setItem('he-reduce-motion',e.target.checked?'1':'0');document.body.classList.toggle('reduce-motion',e.target.checked);};$('#reset-appearance').onclick=()=>{fsTheme.reset();syncThemeInputs();localStorage.removeItem('he-reduce-motion');$('#reduce-motion').checked=false;document.body.classList.remove('reduce-motion');notify('Default charcoal and pumpkin appearance restored.');};
$('#tool-language').value=localStorage.getItem('ibLang')||'en';$('#tool-language').onchange=e=>{localStorage.setItem('ibLang',e.target.value);notify('Tool language saved. Reopen a control page to apply.');};
renderTools();refresh().catch(()=>{});
// Refresh only while visible, and never during a configuration transaction.
setInterval(()=>{if(!document.hidden&&!busy&&activePage==='dashboard')refresh().catch(()=>{});},30000);

function syncThemeInputs(){const colors=fsTheme.read();$('#theme-accent').value=colors.accent;$('#theme-background').value=colors.background;$$('[data-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme===colors.accent)));}
function saveTheme(){try{fsTheme.set({accent:$('#theme-accent').value,background:$('#theme-background').value});syncThemeInputs();notify('Theme colors saved.');}catch(error){notify(error.message,true);}}
$('#theme-accent').onchange=saveTheme;$('#theme-background').onchange=saveTheme;$$('[data-theme]').forEach(button=>button.onclick=()=>{$('#theme-accent').value=button.dataset.theme;saveTheme();});syncThemeInputs();
