'use strict';
let isRunning=false;
async function refreshEngine(){
 const state=heIntegration.parse(await heIntegration.call('status'));
 document.getElementById('engine-name').textContent='Tricky Store OSS / '+state.owner;
 document.getElementById('engine-installed').textContent=state.installed==='1'?(state.enabled==='1'?'Bundled and enabled':'Unified module disabled'):'Payload incomplete — reinstall the unified module';
 document.getElementById('engine-running').textContent=state.running==='1'?'Owned daemon present; interception unverified':'Not running — review Diagnostics';
 document.getElementById('engine-config').textContent=state.config||heIntegration.config;
 document.getElementById('repair-button').disabled=isRunning||state.installed!=='1'||state.enabled!=='1';
 return state;
}
async function runPics(){
 if(isRunning)return;
 const status=document.getElementById('repair-status'),output=document.getElementById('repair-output'),button=document.getElementById('repair-button');
 try{
  const state=await refreshEngine();
  if(state.installed!=='1')throw new Error('Bundled Tricky Store OSS payload is incomplete. Reinstall ForeverStrong.');
  if(state.enabled!=='1')throw new Error('Enable ForeverStrong and reboot before repairing.');
  if(!await window.parent.confirmOperation('Back up configuration, run the Integrity Box action and restart the Tricky Store OSS engine inside this module? This can download configuration and restart Google services. App key persistence is retained.','Run integrated repair?'))return;
  isRunning=true;button.disabled=true;status.textContent='Repair is running. Waiting for actual backend results…';output.hidden=false;output.textContent='Running the unified repair workflow…';
  output.textContent=await window.parent.heRepair();
  status.textContent='Repair workflow completed. Test the affected app; no integrity verdict was measured.';
 }catch(e){status.textContent='Repair did not complete: '+e.message;output.hidden=false;output.textContent=e.message;}
 finally{isRunning=false;await refreshEngine().catch(()=>{});}
}
refreshEngine().catch(e=>{document.getElementById('repair-status').textContent=e.message;document.getElementById('repair-button').disabled=true;});
