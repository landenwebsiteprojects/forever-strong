/* Unified host adapter for the migrated v44 controls. */
(() => {
 const parentHost=window.parent!==window?window.parent:null;
 window.heShell=cmd=>{
  if(!parentHost?.runShellFromIframe)return Promise.reject(new Error('Open this control through the ForeverStrong dashboard.'));
  cmd=String(cmd).replaceAll('/data/adb/modules/playintegrityfix','/data/adb/modules/halloweenedition').replaceAll('/halloweenedition/action.sh','/halloweenedition/integrity-action.sh');
  return parentHost.runShellFromIframe(cmd);
 };
 window.ksu={exec:(cmd,options,callback)=>{
  const p=window.heShell(cmd);
  if(callback){p.then(out=>(window[callback]||parentHost?.[callback])?.(0,out,''),e=>(window[callback]||parentHost?.[callback])?.(1,'',e.message));return;}
  return p;
 },toast:message=>parentHost?.toast?.(String(message))};
 window.kernelsu=window.ksu;window.toast=message=>parentHost?.toast?.(message);
 window.addEventListener('unhandledrejection',e=>{parentHost?.toast?.(e.reason?.message||String(e.reason),true);});
 // Prevent obsolete translated branding and artwork. Source notices remain in Credits.
 document.addEventListener('DOMContentLoaded',()=>{
  heIntegration.call('status').then(raw=>{
   const state=heIntegration.parse(raw);
   document.querySelectorAll('[data-target],[data-destination]').forEach(button=>{
    const dest=button.dataset.target||button.dataset.destination;
    if(!['omk','teesim'].includes(dest))return;
    const enabled=state[dest==='omk'?'external_omk':'external_teesim']==='1';
    button.disabled=!enabled;
    button.title=enabled?'Optional external engine':'External engine is not enabled. Use bundled Tricky Store OSS.';
   });
  }).catch(()=>{});

  const walk=()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.closest('script,style,pre,code,textarea'))continue;if(/[🐱🐈😺😸😹😻😼😽🙀😿😾]/u.test(n.textContent)||/meow/i.test(n.textContent))n.textContent=n.textContent.replace(/[🐱🐈😺😸😹😻😼😽🙀😿😾]/gu,'').replace(/meow(?:na|dump)?/gi,'ForeverStrong');}};
  walk();let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;walk();});}).observe(document.body,{childList:true,subtree:true});
 });
})();
