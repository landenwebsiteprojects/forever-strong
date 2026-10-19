(function(){function logGestureGuard(e){var t=e.target&&e.target.closest&&e.target.closest(".log-scroll,.log-viewer,.log-line,.log-file");if(!t)return;e.stopImmediatePropagation()}document.addEventListener("touchstart",logGestureGuard,true);document.addEventListener("touchmove",logGestureGuard,true);document.addEventListener("touchend",logGestureGuard,true);document.addEventListener("touchcancel",logGestureGuard,true)})();
const MODDIR = `/data/adb/modules/playintegrityfix/webroot/common_scripts`;
const BOXBRAIN = `/data/adb/Box-Brain`;
const LOGDIR = `${BOXBRAIN}/Integrity-Box-Logs`;
const ANNOUNCEMENT_URL = "https://raw.githubusercontent.com/MeowDump/Integrity-Box/refs/heads/main/announcements/notice.md";
const LOG_PAGE_SIZE = 160;
const UI_CACHE_NAME = "integrity-box-ui-v2";
const UI_SETTINGS_FILE = `${BOXBRAIN}/integrity_box_ui_settings`;
const UI_DEFAULTS = {scale:110,fullscreen:true,animatedBackground:false,edgeSwipe:true,edgeTap:false,backButton:true,tabSwipe:true,gestureRight:false,openingToasts:true,skipIntro:false,uiStyle:false,uiCache:true,lang:"en"};
let uiSettings = {...UI_DEFAULTS};
(function hydrateUISettings(){
  try{
    const saved={
      scale:parseInt(localStorage.getItem("ibUiScale")||"",10),
      fullscreen:localStorage.getItem("ibFullscreen"),
      animatedBackground:localStorage.getItem("ibAnimatedBackground"),
      edgeSwipe:localStorage.getItem("ibEdgeSwipe"),
      edgeTap:localStorage.getItem("ibEdgeTap"),
      backButton:localStorage.getItem("ibBackButton"),
      tabSwipe:localStorage.getItem("ibTabSwipe"),
      gestureRight:localStorage.getItem("ibGestureRight"),
      openingToasts:localStorage.getItem("ibOpeningToasts"),
      skipIntro:localStorage.getItem("ibSkipIntro"),
      uiStyle:localStorage.getItem("ibUIStyle"),
      uiCache:localStorage.getItem("ibUICache"),
      lang:localStorage.getItem("ibLang")
    };
    if(Number.isFinite(saved.scale))uiSettings.scale=Math.min(120,Math.max(80,saved.scale));
    for(const key of ["fullscreen","animatedBackground","edgeSwipe","edgeTap","backButton","tabSwipe","gestureRight","openingToasts","skipIntro","uiStyle","uiCache"])if(saved[key]!==null)uiSettings[key]=saved[key]==="1";
    if(typeof saved.lang==="string"&&/^[a-z]{2}(?:_[A-Z]{2})?$/.test(saved.lang))uiSettings.lang=saved.lang;
  }catch{}
})();
function localSetting(key,fallback){try{const v=localStorage.getItem(key);return v===null?fallback:v}catch{return fallback}}
async function loadUISettings(){
  let saved={};
  try{
    const raw=(await runShell(`cat "${UI_SETTINGS_FILE}" 2>/dev/null`)).trim();
    if(raw){
      try{saved=JSON.parse(decodeURIComponent(escape(atob(raw))))||{}}
      catch{try{saved=JSON.parse(raw)||{}}catch{}}
    }
  }catch{}
  try{
    const legacy={scale:parseInt(localStorage.getItem("ibUiScale")||"",10),fullscreen:localStorage.getItem("ibFullscreen"),animatedBackground:localStorage.getItem("ibAnimatedBackground"),openingToasts:localStorage.getItem("ibOpeningToasts"),skipIntro:localStorage.getItem("ibSkipIntro"),uiStyle:localStorage.getItem("ibUIStyle"),uiCache:localStorage.getItem("ibUICache"),lang:localStorage.getItem("ibLang")};
    if(saved.scale===undefined&&Number.isFinite(legacy.scale))saved.scale=Math.min(120,Math.max(80,legacy.scale));
    for(const [k,v] of Object.entries(legacy)){
      if(saved[k]!==undefined||typeof v!=="string"||v===""||k==="scale"||k==="lang")continue;
      saved[k]=v==="1";
    }
    if(typeof legacy.lang==='string'&&/^[a-z]{2}(?:_[A-Z]{2})?$/.test(legacy.lang))saved.lang=legacy.lang;
  }catch{}
  for(const key of Object.keys(UI_DEFAULTS)){if(saved[key]!==undefined)uiSettings[key]=saved[key]}
  uiSettings.scale=Math.min(120,Math.max(80,parseInt(uiSettings.scale,10)||110));
  for(const key of ["fullscreen","animatedBackground","edgeSwipe","edgeTap","backButton","tabSwipe","gestureRight","openingToasts","skipIntro","uiStyle","uiCache"])uiSettings[key]=!!uiSettings[key];
  if(typeof uiSettings.lang!=="string"||!uiSettings.lang)uiSettings.lang="en";
  await persistUISettings();
  return uiSettings;
}
async function persistUISettings(){
  try{const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(uiSettings))));await runShell(`mkdir -p "${BOXBRAIN}"; printf '%s' '${encoded}' | base64 -d > "${UI_SETTINGS_FILE}"`)}catch{}
  try{localStorage.setItem("ibUiScale",String(uiSettings.scale));localStorage.setItem("ibFullscreen",uiSettings.fullscreen?"1":"0");localStorage.setItem("ibAnimatedBackground",uiSettings.animatedBackground?"1":"0");localStorage.setItem("ibEdgeSwipe",uiSettings.edgeSwipe?"1":"0");localStorage.setItem("ibEdgeTap",uiSettings.edgeTap?"1":"0");localStorage.setItem("ibBackButton",uiSettings.backButton?"1":"0");localStorage.setItem("ibTabSwipe",uiSettings.tabSwipe?"1":"0");localStorage.setItem("ibGestureRight",uiSettings.gestureRight?"1":"0");localStorage.setItem("ibOpeningToasts",uiSettings.openingToasts?"1":"0");localStorage.setItem("ibSkipIntro",uiSettings.skipIntro?"1":"0");localStorage.setItem("ibUIStyle",uiSettings.uiStyle?"1":"0");localStorage.setItem("ibUICache",uiSettings.uiCache?"1":"0");localStorage.setItem("ibLang",uiSettings.lang)}catch{}
}
async function setUISetting(key,value){uiSettings[key]=value;await persistUISettings()}
let selectedLog = null, logLines = [], logOffset = 0, activeLogLevel = "ALL", logSearch = "", logDate = "";
const modalBackdrop = document.getElementById("modal-backdrop"), modalTitle = document.getElementById("modal-title"), modalOutput = document.getElementById("modal-output"), modalClose = document.getElementById("modal-close");
let openingToastsEnabled=true;
const messageMap={kill:{success:"DroidGuard has been restarted",type:"info"},user:{start:"Blacklist Unnecessary Apps",type:"info"},stop:{success:"Switched to Blacklist Mode",type:"info"},start:{success:"Switched to Whitelist Mode",type:"info"},xml:{start:"Scanning xml files..",type:"info"},conflict:{start:"Choose ROOT implementation..",type:"info"},pixel:{start:"Spoof your device to app",type:"info"},patch:{start:"Opening configuration..",type:"info"},aosp:{success:"Switched to AOSP Keybox",type:"info"},"resetprop.sh":{success:"Done, Reopen detector to check",type:"info"},selinux:{success:"Spoofed to Enforcing",type:"info"},piffork:{start:"All changes will be applied immediately",type:"info"},propspoofer:{start:"These will be applied till reboot",type:"info"},nogms:{success:"Reboot to apply changes",type:"info"},yesgms:{start:"Reboot to apply changes",type:"info"},"key.sh":{success:"Keybox has been updated",type:"info"},flags:{start:"These requires Reboot / Action",type:"info"},profile:{start:"Good Luck old friend",type:"info"},ctrl:{start:"For those using ROM inbuilt spoofing",type:"info"},"force_override.sh":{start:"Done",type:"info"},pif:{start:"You can update fingerprint without internet",type:"info"},vending:{start:"This will clear data of Play Services & Store",type:"info"},zygisknext:{start:"Whatever you say cutie",type:"info"},cache:{start:"This will delete temporary unnecessary files",type:"info"},hide:{start:"This will hide basic sus paths",type:"info"},scanner:{start:"Click on Run Scan",success:"Detection Complete",type:"info"},support:{start:"Become a Supporter",type:"info"},report:{start:"What's wrong buddy?",type:"info"},assistant:{start:"Let me guide you to the right path",type:"info"},status:{start:"Informs you about keybox & fingerprint validity",type:"info"},"hma.sh":{success:"Done",type:"info"},ulock:{success:"Done",type:"info"},faq:{start:"Coming Soon",type:"info"},nuke:{start:"Coming Soon",type:"info"},repair:{success:"These doesn't require reboot",type:"info"},spoofing:{start:"These are for custom ROM users",type:"info"},pilot:{start:"Updates keybox & fp automatically whether a new key is available",type:"info"},downloader:{start:"Some useful stuff you may need",type:"info"},hash:{start:"Paste your boot hash buddy",success:"Boot hash operation complete",type:"success"}};
function popup(msg,type="info"){try{if(typeof window.toast==="function"){window.toast(String(msg));return}if(window.kernelsu&&typeof window.kernelsu.toast==="function"){window.kernelsu.toast(String(msg));return}if(typeof ksu==="object"&&typeof ksu.toast==="function"){ksu.toast(String(msg));return}}catch{}const n=document.createElement("div");n.className="webui-popup";n.textContent=msg;const colors={error:"#FF4C4C",success:"#0ED000",info:"#1592FF",warn:"#FFB500"};const bg=colors[type]||colors.info;n.style.background=bg+"dd";n.style.color=type==="success"?"#0a1f0f":"#fff";document.body.appendChild(n);requestAnimationFrame(()=>{n.style.top="24px";n.style.opacity="1"});setTimeout(()=>{n.style.top="-80px";n.style.opacity="0";setTimeout(()=>n.remove(),400)},2800)}
async function runShell(cmd){
  if(!cmd)throw new Error("Empty shell command");
  const api=(typeof window.ksu!=="undefined"&&window.ksu)||(typeof window.kernelsu!=="undefined"&&window.kernelsu)||(typeof ksu!=="undefined"&&ksu)||(typeof kernelsu!=="undefined"&&kernelsu);
  if(!api||typeof api.exec!=="function")throw new Error("KSU API unavailable");
  return new Promise((resolve,reject)=>{
    const cb=`__ib_exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let settled=false;
    const finish=(ok,value)=>{if(settled)return;settled=true;try{delete window[cb]}catch{};ok?resolve(String(value??"").replace(/\r/g,"")):reject(value instanceof Error?value:new Error(String(value||"Shell failed")))};
    window[cb]=(code,stdout,stderr)=>{
      const exit=typeof code==="number"?code:Number(code||0);
      finish(exit===0,exit===0?(stdout||""):(stderr||stdout||"Shell failed"));
    };
    try{
      const result=api.exec(cmd,"{}",cb);
      if(result&&typeof result.then==="function"){
        result.then(value=>finish(true,value?.stdout??value??""),error=>finish(false,error));
      }
    }catch(e){finish(false,e)}
    setTimeout(()=>{if(!settled)finish(false,new Error("Shell command timed out"))},15000);
  });
}
async function setFullScreen(enabled){
  uiSettings.fullscreen=!!enabled;
  await persistUISettings();
  try{
    if(enabled){
      try{await runShell(`mkdir -p "${BOXBRAIN}"; touch "${BOXBRAIN}/fullscreen_enabled"`)}catch{}
      if(window.kernelsu?.fullScreen)await window.kernelsu.fullScreen(true);
      else if(window.fullScreen)await window.fullScreen(true);
      else if(typeof ksu!=="undefined"&&ksu?.fullScreen)await ksu.fullScreen(true);
      else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen().catch(()=>{});
    }else{
      try{await runShell(`rm -f "${BOXBRAIN}/fullscreen_enabled"`)}catch{}
      if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen().catch(()=>{});
      try{if(window.kernelsu?.fullScreen)await window.kernelsu.fullScreen(false);else if(window.fullScreen)await window.fullScreen(false);else if(typeof ksu!=="undefined"&&ksu?.fullScreen)await ksu.fullScreen(false)}catch{}
    }
  }catch{}
}
async function getSavedFullscreen(){return !!uiSettings.fullscreen}
async function readFlag(path,defaultValue=false){try{return(await runShell(`[ -f "${path}" ] && echo 1 || echo 0`)).trim()==="1"}catch{return defaultValue}}
async function readToggle(name,defaultValue=true){return (await readFlag(`${BOXBRAIN}/${name}_disabled`,false))?false:defaultValue}
async function writeToggle(name,enabled,defaultValue=true){await runShell(enabled===defaultValue?`rm -f "${BOXBRAIN}/${name}_disabled"`:`touch "${BOXBRAIN}/${name}_disabled"`)}
async function checkGestureConfig(){return{gestureRight:!!uiSettings.gestureRight,backButton:!!uiSettings.backButton,edgeGesture:!!uiSettings.edgeSwipe,edgeTap:!!uiSettings.edgeTap,tabSwipe:!!uiSettings.tabSwipe}}
let iframeHistoryActive=false;
let iframeOpening=false;
let iframeCloseHandler=null;
let iframeHistoryToken="";
let iframeOrigin={tab:"home",subtab:"status"};
function restoreMainHome(){
  document.body.classList.remove("iframe-open","extract-open");
  document.documentElement.classList.remove("iframe-open");
  document.querySelectorAll(".iframe-host-layer,.iframe-back-btn,body > [data-iframe-edge=\"1\"]").forEach(e=>e.remove());
  const targetTab=iframeOrigin.tab||"home";
  document.querySelectorAll(".tab-panel").forEach(panel=>{
    const active=panel.id==="tab-"+targetTab;
    panel.classList.toggle("active",active);
    panel.classList.remove("enter-left","enter-right","exit-left","exit-right");
  });
  document.querySelectorAll(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.tab===targetTab));
  if(targetTab==="home")try{activateHomeSubtab(iframeOrigin.subtab||"status")}catch{}
  document.activeElement?.blur?.();
  window.scrollTo?.(0,0);
}
function cleanupIframeState(){
  document.body.classList.remove("iframe-open");
  document.documentElement.classList.remove("iframe-open");
  document.querySelectorAll(".iframe-host-layer,.iframe-back-btn,body > [data-iframe-edge=\"1\"]").forEach(e=>e.remove());
  document.activeElement?.blur?.();
}
function enterIframeHistory(){
  iframeHistoryToken="ib-iframe-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
  try{location.hash=iframeHistoryToken}catch{}
  iframeHistoryActive=true;
}
function leaveIframeHistory(){
  if(!iframeHistoryActive)return;
  const token=iframeHistoryToken;
  iframeHistoryActive=false;
  iframeHistoryToken="";
  if(location.hash==="#"+token){
    try{history.back()}catch{}
  }
}
async function openIframe(url,options={}){
  if(!url||iframeOpening||document.getElementById("active-iframe"))return;
  iframeOpening=true;
  const external=!!options.external;
  const config={gestureRight:false,backButton:false,edgeGesture:!external,edgeTap:!external};
  try{
    Object.assign(config,await checkGestureConfig());
    if(external){config.edgeGesture=false;config.edgeTap=false;config.backButton=false}
    createIframeUI(url,config);
  }catch{
    createIframeUI(url,config);
  }finally{
    iframeOpening=false;
  }
}
function createIframeUI(url,config){
  iframeOrigin={tab:document.querySelector(".nav-item.active")?.dataset.tab||"home",subtab:document.querySelector(".home-subtab.active")?.dataset.subtab||"status"};
  const iframeLayer=document.createElement("div");
  iframeLayer.className="iframe-host-layer";
  iframeLayer.dataset.iframeHost="1";
  const iframe=document.createElement("iframe");
  iframe.id="active-iframe";
  iframe.title="Integrity Box Support";
  iframe.setAttribute("allowfullscreen","");
  iframe.setAttribute("webkitallowfullscreen","");
  iframe.setAttribute("scrolling","auto");
  iframe.setAttribute("allow","clipboard-read; clipboard-write; fullscreen");
  iframe.setAttribute("referrerpolicy","no-referrer-when-downgrade");
  Object.assign(iframeLayer.style,{position:"fixed",inset:"0",width:"100vw",height:"100dvh",zIndex:9998,background:"transparent",overflow:"hidden",pointerEvents:"auto"});
  Object.assign(iframe.style,{position:"absolute",inset:"0",width:"100%",height:"100%",border:"none",background:"transparent",display:"block",userSelect:"text",webkitUserSelect:"text",touchAction:"auto",pointerEvents:"auto"});
  iframeLayer.appendChild(iframe);
  document.body.classList.add("iframe-open");
  document.documentElement.classList.add("iframe-open");
  document.body.appendChild(iframeLayer);
  iframe.src=url;
  enterIframeHistory();

  const useFloatingBack=!!config.backButton;
  const useEdgeGesture=!!config.edgeGesture;
  const useEdgeTap=!!config.edgeTap;
  const isRight=!!config.gestureRight;
  let edge=null,backBtn=null,closed=false;

  const closeIframe=(fromHistory=false)=>{
    if(closed)return;
    closed=true;
    const token=iframeHistoryToken;
    iframeHistoryActive=false;
    iframeHistoryToken="";
    iframeCloseHandler=null;
    try{window.removeEventListener("ibAnimatedBackgroundChange",syncIframeTheme)}catch{}
    iframe.src="about:blank";
    iframe.remove();
    iframeLayer.remove();
    edge?.remove();
    backBtn?.remove();
    cleanupIframeState();
    restoreMainHome();
    if(!fromHistory&&location.hash==="#"+token){
      try{history.back()}catch{}
    }
  };

  iframeCloseHandler=closeIframe;

  if(useEdgeGesture||useEdgeTap){
    edge=document.createElement("div");
    edge.dataset.iframeEdge="1";
    edge.setAttribute("aria-hidden","true");
    Object.assign(edge.style,{position:"fixed",top:"0",[isRight?"right":"left"]:"0",width:"34px",height:"100dvh",zIndex:"100000000",background:"transparent",pointerEvents:"auto",touchAction:"none",userSelect:"none",webkitUserSelect:"none"});
    document.body.appendChild(edge);
    let startX=0,startY=0,startTime=0;
    const onStart=e=>{const t=e.touches?.[0]||e;startX=t.clientX;startY=t.clientY;startTime=Date.now()};
    const onEnd=e=>{
      if(closed)return;
      const t=e.changedTouches?.[0]||e;
      const dx=t.clientX-startX;
      const diff=isRight?-dx:dx;
      const dy=Math.abs(t.clientY-startY);
      const dt=Date.now()-startTime;
      const tap=useEdgeTap&&Math.abs(dx)<18&&dy<28&&dt<500;
      const swipe=useEdgeGesture&&diff>45&&dy<Math.max(70,diff*1.25)&&dt<500;
      if(tap||swipe){e.preventDefault?.();e.stopPropagation?.();closeIframe()}
    };
    edge.addEventListener("touchstart",onStart,{passive:true});
    edge.addEventListener("touchend",onEnd,{passive:false});
    edge.addEventListener("pointerdown",onStart,{passive:true});
    edge.addEventListener("pointerup",onEnd,{passive:false});
    edge.addEventListener("click",e=>{if(useEdgeTap&&!closed)closeIframe()});
  }

  if(useFloatingBack){
    backBtn=document.createElement("button");
    backBtn.type="button";
    backBtn.className="iframe-back-btn";
    backBtn.setAttribute("aria-label","Back");
    backBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 5.3 8 12l6.7 6.7"/><path d="M8.5 12H20"/></svg>';
    backBtn.style[isRight?"left":"right"]="16px";
    const back=event=>{event?.preventDefault?.();event?.stopPropagation?.();closeIframe()};
    backBtn.addEventListener("click",back);
    document.body.appendChild(backBtn);
  }
}
window.addEventListener("hashchange",()=>{
  if(iframeCloseHandler&&iframeHistoryActive&&location.hash!=="#"+iframeHistoryToken){
    iframeCloseHandler(true);
  }
});
window.addEventListener("popstate",()=>{
  if(iframeCloseHandler&&iframeHistoryActive&&location.hash!=="#"+iframeHistoryToken){
    iframeCloseHandler(true);
  }
});
window.runShellFromIframe=async cmd=>runShell(cmd);
async function readExpiry(file){return(await runShell(`grep -i 'Estimated Expiry' "${file}" 2>/dev/null | head -n1 | cut -d':' -f2-`)).trim()}
async function fetchKeyboxStatus(){
  try{
    if(await readFlag(`${BOXBRAIN}/disable-default-source`,false))return{status:"UNOFFICIAL",label:"Unofficial Keybox"};
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const r=await fetch("https://raw.githubusercontent.com/MeowDump/Integrity-Box/refs/heads/main/keybox/key-status",{cache:"no-store",signal:controller.signal});
      if(!r.ok)throw new Error("HTTP "+r.status);
      const t=await r.text();
      if(t.includes("🟢🟢🟢"))return{status:"STRONG",label:"Strong"};
      if(t.includes("🟢🟢🔴"))return{status:"DEVICE",label:"Device"};
      if(t.includes("🔴🔴🔴"))return{status:"BANNED",label:"Banned"};
      return{status:"UNKNOWN",label:"Unknown"};
    }finally{clearTimeout(timer)}
  }catch{return{status:"OFFLINE",label:"Offline"}}
}
function setStatus(id,text){const e=document.getElementById("status-"+id);if(e)e.textContent=text}
function applyIntegrity(result){
  const card=document.getElementById("home-integrity-card"),value=document.getElementById("home-status-integrity");
  const title={STRONG:"Strong Integrity",DEVICE:"Device Integrity",BANNED:"Keybox is Banned",UNKNOWN:"Unavailable",OFFLINE:"No Internet"}[result.status]||"Unavailable";
  if(value){value.textContent=title;value.dataset.integrityStatus=result.status||"UNKNOWN"}
  if(card){
    card.classList.remove("is-good","is-warn","is-bad","is-offline");
    if(result.status==="STRONG")card.classList.add("is-good");
    else if(result.status==="DEVICE")card.classList.add("is-warn");
    else if(result.status==="BANNED")card.classList.add("is-bad");
    else if(result.status==="OFFLINE")card.classList.add("is-offline");
  }
}
async function updateDashboard(){
  const items={
    selinux:"getenforce || echo Unknown",
    apps:"if [ -f /data/adb/modules/playintegrityfix/apps.txt ]; then awk 'NF{c++} END{print c+0}' /data/adb/modules/playintegrityfix/apps.txt; else echo 0; fi",
    target:"if [ -f /data/adb/tricky_store/target.txt ]; then awk 'NF{c++} END{print c+0}' /data/adb/tricky_store/target.txt; else echo 0; fi",
    pixel:"[ -f /data/adb/modules/playintegrityfix/custom.pif.prop ] && awk -F= '/^MODEL=/{print $2}' /data/adb/modules/playintegrityfix/custom.pif.prop || echo None",
    patch:"getprop ro.build.version.security_patch || echo Unknown",
    profile:`if [ -f ${BOXBRAIN}/advanced ]; then echo 'Supreme'; elif [ -f ${BOXBRAIN}/pixelify ]; then echo 'Pixelify'; elif [ -f ${BOXBRAIN}/legacy ]; then echo 'Legacy'; elif [ -f ${BOXBRAIN}/wipe ]; then echo 'Meta'; else echo 'None'; fi`,
    LineageProp:`if [ -f ${BOXBRAIN}/safemode ]; then echo 'Skipped due to OTA'; elif getprop | grep -iq 'lineage'; then echo Detected; else echo Spoofed; fi`,
    zygote:`if [ -e /data/adb/modules/playintegrityfix/stop ]; then echo Disabled; else echo Enabled; fi`,
    zygiskless:`if [ -d /data/adb/modules/playintegrityfix/zygisk ]; then echo Disabled; else echo Enabled; fi`,
    blacklist:"if [ -f /data/adb/Box-Brain/blacklist.txt ]; then awk 'NF{c++} END{print c+0}' /data/adb/Box-Brain/blacklist.txt; else echo 0; fi",
    advanced:`if [ -e ${BOXBRAIN}/PIF/advanced ]; then echo Enabled; else echo Disabled; fi`,
    romSpoofing:`if [ -e ${BOXBRAIN}/disablevending ] && [ -e ${BOXBRAIN}/disablegms ]; then echo Disabled; elif [ -e ${BOXBRAIN}/disablevending ] || [ -e ${BOXBRAIN}/disablegms ]; then echo 'Partially disabled'; else echo 'Not configured'; fi`,
    bootHash:`if [ -s ${BOXBRAIN}/hash.txt ]; then echo Configured; else echo Disabled; fi`
  };
  const statusMap={apps:"target",zygote:"zygote",zygiskless:"zygiskless",blacklist:"blacklist",advanced:"advanced",romSpoofing:"rom-spoofing",bootHash:"boot-hash"};
  await Promise.all(Object.entries(items).map(async([id,cmd])=>{try{const value=(await runShell(cmd)).trim()||"Unknown";setStatus(statusMap[id]||id,value)}catch{setStatus(statusMap[id]||id,"Unknown")}}));
  const extra={
    device:'getprop ro.product.manufacturer; printf " "; getprop ro.product.model',
    android:'getprop ro.build.version.release || echo Unknown',
    arch:'getprop ro.product.cpu.abi || uname -m',
    cpu:'getprop ro.soc.model 2>/dev/null || getprop ro.hardware 2>/dev/null || uname -m',
    build:'getprop ro.build.display.id || getprop ro.build.version.incremental || echo Unknown',
    uptime:"awk '{printf \"%.0f\", $1}' /proc/uptime 2>/dev/null || echo 0"
  };
  await Promise.all(Object.entries(extra).map(async([id,cmd])=>{try{const raw=(await runShell(cmd)).trim();const e=document.getElementById("overview-"+id);if(!e)return;if(id==="uptime"){const sec=Math.max(0,parseInt(raw||"0",10));const d=Math.floor(sec/86400),h=Math.floor(sec%86400/3600),m=Math.floor(sec%3600/60);e.textContent=(d?d+"d ":"")+h+"h "+m+"m"}else if(id==="moduleVersion"){const m=raw.match(/(?:^|\n)version=(.*)/);e.textContent=(m&&m[1]?m[1].trim():"Unknown")}else e.textContent=raw||"Unknown"}catch{const e=document.getElementById("overview-"+id);if(e)e.textContent="Unknown"}}));
  try{const exp=await readExpiry("/data/adb/modules/playintegrityfix/custom.pif.prop");if(!exp)setStatus("expiry","Unknown");else{const d=new Date(exp.trim().replace(/[^0-9-]/g,"")+"T00:00:00");setStatus("expiry",isNaN(d.getTime())?"Unknown":Math.max(0,Math.floor((d-new Date())/86400000))+" days")}}catch{setStatus("expiry","Unknown")}
  const result=await fetchKeyboxStatus();applyIntegrity(result);
  [["pixel","info-config"],["patch","info-patch"]].forEach(([a,b])=>{const x=document.getElementById("status-"+a),y=document.getElementById(b);if(x&&y)y.textContent=x.textContent});
}
function attachButtonListeners(){document.querySelectorAll(".list-row:not(.static)").forEach(btn=>{if(btn._attached)return;btn._attached=true;btn.addEventListener("click",async()=>{const script=btn.dataset.script,type=btn.dataset.type;btn.style.pointerEvents="none";btn.style.opacity=".5";try{const iframeTypes=["scanner","hash","user","flags","cache","nuke","piffork","propspoofer","pif","vending","downloader","keymint","support","report","profile","assistant","repair","pilot","faq","spoofing","status","tee","xml","conflict","blog","pixel","hide","patch","source","ctrl"];if(iframeTypes.includes(type)){const pathMap={ctrl:"./Control/index.html",hash:"./BootHash/index.html",flags:"./Flags/index.html",piffork:"./PlayIntegrityFork/index.html",propspoofer:"./PropSpoofer/index.html",vending:"./Certified/index.html",support:"./Support/index.html",report:"./Report/index.html",user:"./TrickyStore/index.html",xml:"./KeyboxLoader/index.html",conflict:"./RootImplementation/index.html",blog:"https://meowblog.github.io/Articles",source:"./KeyboxSource/index.html",pixel:"./Pixel/index.html",hide:"./HideMyFiles/index.html",profile:"./Profile/index.html",assistant:"./Assistant/index.html",repair:"./RepairMode/index.html",keymint:"./Keymint/index.html",faq:"./Faq/index.html",pilot:"./Pilot/index.html",spoofing:"./Spoofing/index.html",downloader:"./Downloader/index.html",tee:"./TEEsimulator/index.html"};const msg=messageMap[(type||script||"").replace(/\.sh$/i,"")];if(openingToastsEnabled)popup(msg?.start||"Opening...",msg?.type||"info");return openIframe(pathMap[type],{external:type==="support"})}if(script){if(messageMap[script]?.start)popup(messageMap[script].start,messageMap[script].type);await runShell(`sh ${MODDIR}/${script}`);if(messageMap[script]?.success)popup(messageMap[script].success,messageMap[script].type)}}catch(e){popup("Error: "+e.message,"error")}finally{btn.style.pointerEvents="";btn.style.opacity="";setTimeout(updateDashboard,500)}})})}
function activateHomeSubtab(key){
  const safe=key||"status";
  document.querySelectorAll(".home-subtab").forEach(b=>b.classList.toggle("active",b.dataset.subtab===safe));
  document.querySelectorAll(".home-view").forEach(v=>v.classList.toggle("active",v.id==="home-view-"+safe));
  if(safe==="logs")loadLogFiles();
  if(safe==="announcements")loadAnnouncements();
}
function initHomeSubtabs(){
  document.querySelectorAll(".home-subtab").forEach(btn=>{
    if(btn._homeSubtabAttached)return;
    btn._homeSubtabAttached=true;
    btn.addEventListener("click",()=>{
      const key=btn.dataset.subtab;
      if(key==="support"){
        activateHomeSubtab("status");
        openIframe("https://MeowDump.github.io",{external:true,fromSupportTab:true});
        return;
      }
      activateHomeSubtab(key);
    });
  });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function getMarkdownParser(){
  const m=window.marked;
  if(!m)return null;
  if(typeof m.parse==="function")return m;
  if(m.marked&&typeof m.marked.parse==="function")return m.marked;
  return null;
}
function markdownToHtml(md){
  const parser=getMarkdownParser();
  if(!parser){
    console.error("Markdown renderer unavailable");
    return `<p>${escapeHtml(md).replace(/\n/g,"<br>")}</p>`;
  }
  try{
    const renderer=new parser.Renderer();
    renderer.html=token=>escapeHtml(typeof token==="string"?token:token?.text||"");
    return parser.parse(String(md||""),{gfm:true,breaks:false,mangle:false,headerIds:false,renderer});
  }catch(e){
    console.error("Markdown rendering failed",e);
    return `<p>${escapeHtml(md).replace(/\n/g,"<br>")}</p>`;
  }
}
function openAnnouncementUrl(url){
  try{
    const u=new URL(url,location.href);
    if(!/^https?:$/i.test(u.protocol))return;
    const safe=u.href;
    runShell(`am start -a android.intent.action.VIEW -d ${shellQuote(safe)}`).catch(()=>{
      try{window.open(safe,"_blank","noopener,noreferrer")}catch{}
    });
  }catch(e){console.error("Invalid announcement URL",e)}
}
function bindAnnouncementLinks(out){
  out.querySelectorAll("a[href]").forEach(a=>{
    a.style.pointerEvents="auto";
    a.setAttribute("target","_blank");
    a.setAttribute("rel","noopener noreferrer");
    a.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();
      openAnnouncementUrl(a.getAttribute("href"));
    });
  });
}
let announcementCache="";
async function loadAnnouncements(force=false){
  const out=document.getElementById("announcement-output");
  if(!out)return;
  if(announcementCache&&!force){out.innerHTML=markdownToHtml(announcementCache);bindAnnouncementLinks(out);return}
  out.innerHTML='<div class="empty-state">Loading announcements...</div>';
  try{
    const r=await fetch(ANNOUNCEMENT_URL,{cache:force?"no-store":"default"});
    if(!r.ok)throw Error("HTTP "+r.status);
    announcementCache=await r.text();
    out.innerHTML=markdownToHtml(announcementCache);
    bindAnnouncementLinks(out);
  }catch(e){out.innerHTML='<div class="empty-state">Unable to load announcements. Check your connection and try again.</div>'}
}
function shellQuote(value){return "'"+String(value).replace(/'/g,"'\\''")+"'"}
function parseTimestamp(line){
  const text=String(line||"");
  const months={jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,sept:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};
  let m=text.match(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/);
  if(m){
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]||0),Number((m[7]||"").slice(0,3).padEnd(3,"0")||0));
    if(!Number.isNaN(d.getTime()))return {date:d,key:d.getTime(),text:m[0]};
  }
  m=text.match(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?/);
  if(m){
    const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]),Number(m[5]),Number(m[6]||0),Number((m[7]||"").slice(0,3).padEnd(3,"0")||0));
    if(!Number.isNaN(d.getTime()))return {date:d,key:d.getTime(),text:m[0]};
  }
  m=text.match(/\b([A-Za-z]{3,9})[ ._-]+(\d{1,2})(?:,?[ ._-]+(\d{4}))?[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP]M))?/i);
  if(m&&months[m[1].toLowerCase()]!==undefined){
    let year=m[3]?Number(m[3]):new Date().getFullYear(), hour=Number(m[4]);
    const ap=(m[7]||"").toUpperCase(); if(ap==="PM"&&hour<12)hour+=12; if(ap==="AM"&&hour===12)hour=0;
    const d=new Date(year,months[m[1].toLowerCase()],Number(m[2]),hour,Number(m[5]),Number(m[6]||0));
    if(!Number.isNaN(d.getTime()))return {date:d,key:d.getTime(),text:m[0]};
  }
  return null;
}
function lineHtml(line){
  const ts=parseTimestamp(line);
  const escaped=escapeHtml(line);
  if(!ts)return `<div class="log-line"><span class="log-line-text">${escaped}</span></div>`;
  const prefix=escapeHtml(ts.text);
  const rest=escaped.replace(prefix,"");
  let cls="";
  if(/\b(error|failed|failure|fatal|denied|exception)\b/i.test(line))cls=" log-severity-error";
  else if(/\b(warn|warning)\b/i.test(line))cls=" log-severity-warn";
  else if(/\b(success|passed|ok|done)\b/i.test(line))cls=" log-severity-success";
  return `<div class="log-line${cls}"><time class="log-time">${prefix}</time><span class="log-line-text">${rest}</span></div>`;
}
function renderLogFileList(files,selected){
  const list=document.getElementById("log-files");
  if(!list)return;
  if(!files.length){list.innerHTML='<div class="empty-state">No readable log files found.</div>';return;}
  list.innerHTML=files.map(name=>{
    const active=name===selected?' active':'';
    return `<button type="button" class="log-file${active}" data-log-file="${escapeHtml(name)}" title="Open ${escapeHtml(name)}"><span class="log-file-name">${escapeHtml(name)}</span><span class="log-file-arrow">›</span></button>`;
  }).join('');
  list.querySelectorAll('.log-file').forEach(btn=>btn.addEventListener('click',()=>openLogFile(btn.dataset.logFile)));
}
async function listLogFiles(){
  const raw=await runShell(`
    dir=${shellQuote(LOGDIR)}
    if [ ! -e "$dir" ]; then echo __IB_MISSING__
    elif [ ! -d "$dir" ]; then echo __IB_NOT_DIRECTORY__
    elif [ ! -r "$dir" ] || [ ! -x "$dir" ]; then echo __IB_DENIED__
    else
      find "$dir" -maxdepth 1 -type f -printf '%f\n' 2>/dev/null
    fi
  `);
  const lines=String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.includes('__IB_MISSING__'))throw new Error(`Log directory does not exist: ${LOGDIR}`);
  if(lines.includes('__IB_NOT_DIRECTORY__'))throw new Error(`Log path is not a directory: ${LOGDIR}`);
  if(lines.includes('__IB_DENIED__'))throw new Error(`Permission denied while accessing: ${LOGDIR}`);
  return [...new Set(lines.filter(x=>!x.startsWith('__IB_')&&!/^\./.test(x)))].sort((a,b)=>a.localeCompare(b));
}
let currentLogText = "";
async function openLogFile(file){
  const output=document.getElementById('log-output'),meta=document.getElementById('log-meta'),title=document.getElementById('log-viewer-title'),copy=document.getElementById('log-copy');
  if(!output||!file)return;
  selectedLog=file;
  document.querySelectorAll('.log-file').forEach(btn=>btn.classList.toggle('active',btn.dataset.logFile===file));
  output.innerHTML='<div class="empty-state">Reading log…</div>';
  if(title)title.textContent=file;
  if(meta)meta.textContent='Reading…';
  if(copy){copy.disabled=true;copy.textContent='Copy'}
  currentLogText="";
  try{
    const path=`${LOGDIR}/${file}`;
    const raw=await runShell(`if [ ! -e ${shellQuote(path)} ]; then echo __IB_MISSING__; elif [ ! -f ${shellQuote(path)} ]; then echo __IB_NOT_FILE__; elif [ ! -r ${shellQuote(path)} ]; then echo __IB_DENIED__; else cat ${shellQuote(path)} 2>/dev/null; fi`);
    const rawText=String(raw||'').replace(/\r/g,'');
    if(rawText.trim()==='__IB_MISSING__')throw new Error('The selected log file no longer exists.');
    if(rawText.trim()==='__IB_NOT_FILE__')throw new Error('The selected path is not a regular log file.');
    if(rawText.trim()==='__IB_DENIED__')throw new Error('Permission denied while reading the selected log file.');
    currentLogText=rawText;
    if(!rawText){
      output.innerHTML='<div class="empty-state">This log file is empty.</div>';
      if(meta)meta.textContent='Empty file';
    }else{
      const lines=rawText.replace(/\n$/,'').split('\n');
      output.innerHTML=lines.map(lineHtml).join('');
      if(meta)meta.textContent=`Complete file • ${lines.length} line${lines.length===1?'':'s'}`;
      if(copy)copy.disabled=false;
    }
  }catch(e){
    output.innerHTML=`<div class="empty-state log-error"><strong>Unable to open log</strong><span>${escapeHtml(e?.message||String(e))}</span></div>`;
    if(meta)meta.textContent='Read failed';
  }
}
function initLogCopy(){
  const copy=document.getElementById('log-copy');
  if(!copy)return;
  copy.addEventListener('click',async()=>{
    if(!currentLogText)return;
    try{
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(currentLogText);}
      else{const ta=document.createElement('textarea');ta.value=currentLogText;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
      copy.textContent='Copied';
      popup('Log copied to clipboard','success');
      setTimeout(()=>{if(copy)copy.textContent='Copy'},1400);
    }catch{popup('Unable to copy log','error')}
  });
}
function initLogFileToggle(){
  const section=document.getElementById('logs-file-section'),toggle=document.getElementById('logs-file-toggle');
  if(!section||!toggle)return;
  toggle.addEventListener('click',()=>{
    const collapsed=section.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded',String(!collapsed));
  });
}
function initLogRefresh(){
  document.getElementById('refresh-logs')?.addEventListener('click',()=>loadLogFiles());
}
async function loadLogFiles(){
  const list=document.getElementById('log-files'),output=document.getElementById('log-output'),meta=document.getElementById('log-meta'),title=document.getElementById('log-viewer-title');
  if(!list)return;
  list.innerHTML='<div class="empty-state">Scanning available logs…</div>';
  if(output)output.innerHTML='<div class="empty-state">Select a file above.</div>';
  if(meta)meta.textContent='Scanning…';
  if(title)title.textContent='Select a log file';
  try{
    const files=await listLogFiles();
    const preferred=selectedLog&&files.includes(selectedLog)?selectedLog:null;
    renderLogFileList(files,preferred);
    if(!files.length){if(meta)meta.textContent='No files';return;}
    if(preferred)await openLogFile(preferred);
    else if(meta)meta.textContent=`${files.length} file${files.length===1?'':'s'} available`;
  }catch(e){
    list.innerHTML=`<div class="empty-state log-error"><strong>Log scan failed</strong><span>${escapeHtml(e?.message||String(e))}</span></div>`;
    if(meta)meta.textContent='Scan failed';
  }
}
function applyLanguageDirection(lang){
  const rtl=['ar','fa','he','ur'].includes(String(lang||'').toLowerCase());
  document.documentElement.dir=rtl?'rtl':'ltr';
  document.body.dir=rtl?'rtl':'ltr';
  document.documentElement.classList.toggle('rtl',rtl);
  document.documentElement.classList.toggle('ltr',!rtl);
}
function initLanguageSelector(){
  const select=document.getElementById('lang-dropdown-community');
  if(!select)return;
  select.value=uiSettings.lang||'en';
  applyLanguageDirection(select.value);
  select.addEventListener('change',async()=>{
    const lang=select.value||'en';
    try{
      if(window.i18nSetLanguage)await window.i18nSetLanguage(lang);
      else if(lang==='en')location.reload();
    }catch{}
    uiSettings.lang=lang;
    await persistUISettings();
    applyLanguageDirection(lang);
    broadcastLangChange(lang);
  });
}
function initInterfaceSettings(){
  const edgeSwipe=document.getElementById("toggle-edge-swipe"),edgeTap=document.getElementById("toggle-edge-tap"),backButton=document.getElementById("toggle-back-button"),tabSwipe=document.getElementById("toggle-tab-swipe"),fullscreen=document.getElementById("toggle-fullscreen"),animated=document.getElementById("toggle-animated-background"),toasts=document.getElementById("toggle-opening-toasts"),skipIntro=document.getElementById("toggle-skip-intro"),left=document.getElementById("gesture-left"),right=document.getElementById("gesture-right");
  if(fullscreen){fullscreen.checked=uiSettings.fullscreen;if(uiSettings.fullscreen)setTimeout(()=>setFullScreen(true),120);fullscreen.addEventListener("change",()=>setFullScreen(fullscreen.checked))}
  if(animated){animated.checked=uiSettings.animatedBackground;document.documentElement.classList.toggle("animated-background",uiSettings.animatedBackground);document.body.classList.toggle("animated-background",uiSettings.animatedBackground);animated.addEventListener("change",async()=>{const on=animated.checked;document.documentElement.classList.toggle("animated-background",on);document.body.classList.toggle("animated-background",on);await setUISetting("animatedBackground",on);window.dispatchEvent(new Event("ibAnimatedBackgroundChange"))})}
  if(toasts){openingToastsEnabled=uiSettings.openingToasts;toasts.checked=openingToastsEnabled;toasts.addEventListener("change",()=>{openingToastsEnabled=toasts.checked;setUISetting("openingToasts",openingToastsEnabled)})}
  if(skipIntro){skipIntro.checked=uiSettings.skipIntro;skipIntro.addEventListener("change",()=>{const on=skipIntro.checked;document.documentElement.classList.toggle("skip-intro",on);setUISetting("skipIntro",on);if(on)document.getElementById("intro-overlay")?.remove()})}
  if(edgeSwipe){edgeSwipe.checked=uiSettings.edgeSwipe;edgeTap.checked=uiSettings.edgeTap;backButton.checked=uiSettings.backButton;tabSwipe.checked=uiSettings.tabSwipe;updateSideButtons(uiSettings.gestureRight);edgeSwipe.addEventListener("change",async()=>{uiSettings.edgeSwipe=edgeSwipe.checked;await persistUISettings();popup(edgeSwipe.checked?"Edge swipe enabled":"Edge swipe disabled")});edgeTap.addEventListener("change",async()=>{uiSettings.edgeTap=edgeTap.checked;await persistUISettings();popup(edgeTap.checked?"Edge tap enabled":"Edge tap disabled")});backButton.addEventListener("change",async()=>{uiSettings.backButton=backButton.checked;await persistUISettings();popup(backButton.checked?"Floating back button enabled":"Floating back button disabled")});tabSwipe.addEventListener("change",async()=>{uiSettings.tabSwipe=tabSwipe.checked;await persistUISettings();popup(tabSwipe.checked?"Tab swipe enabled":"Tab swipe disabled")});left.onclick=()=>setGestureSide(false);right.onclick=()=>setGestureSide(true)}}
function updateSideButtons(isRight){document.getElementById("gesture-left")?.classList.toggle("active",!isRight);document.getElementById("gesture-right")?.classList.toggle("active",isRight);const l=document.getElementById("gesture-side-label");if(l)l.textContent=isRight?"Right edge":"Left edge"}
async function setGestureSide(isRight){uiSettings.gestureRight=!!isRight;await persistUISettings();updateSideButtons(isRight);popup(isRight?"Back gesture: right edge":"Back gesture: left edge")}
function initUIStyle(){
  const toggle=document.getElementById("toggle-ui-style");
  const label=document.getElementById("ui-style-label");
  if(!toggle)return;
  const apply=on=>{document.documentElement.classList.toggle("ui-alt",on);toggle.checked=on;if(label)label.textContent=on?"Enhanced":"Standard";setUISetting("uiStyle",!!on)};
  apply(uiSettings.uiStyle);
  toggle.addEventListener("change",()=>apply(toggle.checked));
}

function initScale(){
  const slider=document.getElementById("ui-scale-slider"),value=document.getElementById("ui-scale-value"),app=document.querySelector(".app"),reset=document.getElementById("ui-scale-reset");
  if(!slider||!app)return;
  const apply=v=>{v=Math.min(120,Math.max(80,Number(v)||110));const scale=v/100;document.documentElement.style.setProperty("--ui-scale",String(scale));app.style.setProperty("--ui-scale",String(scale));app.style.setProperty("zoom",String(scale));slider.value=String(v);if(value)value.textContent=v+"%";uiSettings.scale=v;persistUISettings()};
  slider.addEventListener("input",()=>apply(slider.value));
  slider.addEventListener("change",()=>apply(slider.value));
  reset?.addEventListener("click",()=>apply(110));
  apply(uiSettings.scale);
}
function initExtractPage(){const page=document.getElementById("extract-page"),open=document.getElementById("extract-all-button"),close=document.getElementById("extract-back"),refresh=document.getElementById("extract-refresh"),info=document.getElementById("extract-info");if(!page||!open||!close)return;open.onclick=()=>{page.classList.add("active");document.body.classList.add("extract-open");void page.offsetHeight;requestAnimationFrame(()=>updateDashboard())};close.onclick=()=>{page.classList.remove("active");document.body.classList.remove("extract-open")};refresh?.addEventListener("click",updateDashboard);info?.addEventListener("click",()=>{modalTitle.textContent="System Overview";modalOutput.textContent="Device and Android information are read from system properties.\n\nApps using keybox counts non-empty package-name lines in /data/adb/modules/playintegrityfix/apps.txt.\n\nZygote Injection is disabled when /data/adb/modules/playintegrityfix/stop exists.\n\nZygiskless Mode is enabled when /data/adb/modules/playintegrityfix/zygisk does not exist.\n\nApps prevented from accessing keybox counts non-empty package-name lines in /data/adb/Box-Brain/blacklist.txt.\n\nAdvanced Spoofing is enabled when /data/adb/Box-Brain/PIF/advanced exists.\n\nROM Spoofing is disabled when both /data/adb/Box-Brain/disablevending and /data/adb/Box-Brain/disablegms exist, partially disabled when only one exists, and not configured when neither exists.\n\nBoot Hash Config is disabled when /data/adb/Box-Brain/hash.txt is missing or empty.";modalBackdrop.classList.remove("hidden")})}
function initIntegrityCard(){
  const card=document.getElementById("home-integrity-card"),toggle=document.getElementById("integrity-toggle"),heading=document.querySelector(".integrity-status-heading");
  if(!card||!toggle)return;
  const apply=expanded=>{card.classList.toggle("collapsed",!expanded);toggle.setAttribute("aria-expanded",String(expanded));toggle.setAttribute("aria-label",expanded?"Minimize integrity status":"Expand integrity status");toggle.title=expanded?"Minimize integrity status":"Expand integrity status";heading?.classList.toggle("hidden",!expanded)};
  apply(false);
  toggle.addEventListener("click",()=>apply(card.classList.contains("collapsed")));
}
function initTabs(){
  const navItems=Array.from(document.querySelectorAll(".nav-item"));
  if(!navItems.length)return;
  let currentIndex=Math.max(0,navItems.findIndex(n=>n.classList.contains("active")));
  if(currentIndex<0)currentIndex=0;
  const switchTab=index=>{
    if(index<0||index>=navItems.length)return;
    if(navItems[index].dataset.tab==="home")activateHomeSubtab("status");
    if(index===currentIndex)return;
    const current=document.getElementById("tab-"+(navItems[currentIndex].dataset.tab||""));
    const next=document.getElementById("tab-"+(navItems[index].dataset.tab||""));
    if(!current||!next)return;
    document.querySelectorAll(".tab-panel").forEach(panel=>{panel.classList.remove("active","enter-left","enter-right","exit-left","exit-right");panel.scrollTop=0});
    document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
    navItems[index].classList.add("active");
    next.classList.add("active");
    currentIndex=index;
  };
  navItems.forEach((item,index)=>item.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();switchTab(index)}));
  const app=document.querySelector(".app");
  if(!app)return;
  let sx=0,sy=0,st=0;
  app.addEventListener("touchstart",e=>{
    if(e.target.closest("button,a,input,select,textarea,.home-subtab,.log-scroll,.log-file"))return;
    const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();
  },{passive:true});
  app.addEventListener("touchend",e=>{
    if(e.target.closest("button,a,input,select,textarea,.home-subtab,.log-scroll,.log-file"))return;
    const sw=document.getElementById("toggle-tab-swipe");
    if(sw&&!sw.checked)return;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Date.now()-st>350||Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*1.35)return;
    switchTab(dx<0?currentIndex+1:currentIndex-1);
  },{passive:true});
}
function initModal(){modalClose?.addEventListener("click",()=>modalBackdrop.classList.add("hidden"));modalBackdrop?.addEventListener("click",e=>{if(e.target===modalBackdrop)modalBackdrop.classList.add("hidden")})}
function hideIntro(){
  const intro=document.getElementById("intro-overlay");
  if(!intro)return;
  let skip=false;
  skip=!!uiSettings.skipIntro
  if(skip){intro.remove();return}
  const dismiss=()=>{
    if(intro.dataset.dismissed)return;
    intro.dataset.dismissed="1";
    intro.classList.add("hidden");
    setTimeout(()=>intro.remove(),450);
  };
  intro.addEventListener("click",dismiss,{once:true});
  setTimeout(dismiss,850);
}

async function initUICache(){
  const toggle=document.getElementById("toggle-ui-cache");
  const key="ibUICache";
  const cacheName=UI_CACHE_NAME;
  let enabled=uiSettings.uiCache
  if(toggle)toggle.checked=enabled;
  const supported="caches" in window;
  const cacheAssets=async()=>{
    if(!supported)return;
    try{
      const cache=await caches.open(cacheName);
      const urls=[location.href,"style.css","script.js","icon.png","meowna.ttf","marked.min.js"];
      await Promise.all(urls.map(async url=>{try{const r=await fetch(url,{cache:"reload"});if(r.ok)await cache.put(url,r.clone())}catch{}}));
      if(window.i18nEnsureCached)await window.i18nEnsureCached(uiSettings.lang);
    }catch{}
  };
  const clearCache=async()=>{
    if(supported)try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith("integrity-box-ui-")).map(key=>caches.delete(key)));
    }catch{}
    try{window.i18nClearCache?.()}catch{}
  };
  if(enabled)cacheAssets();
  toggle?.addEventListener("change",async()=>{
    enabled=toggle.checked;
    uiSettings.uiCache=enabled;persistUISettings()
    if(enabled)await cacheAssets();
    else await clearCache();
  });
  if(enabled&&"serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
    try{await navigator.serviceWorker.register("service-worker.js",{scope:"./"})}catch{}
  }
  if(!enabled&&"serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){
    try{const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}catch{}
  }
}
initLogFileToggle();
initLogCopy();
initLogRefresh();
function closeUIResetConfirm(){
  document.getElementById("reset-ui-confirm")?.classList.add("hidden");
}
function openUIResetConfirm(){
  const modal=document.getElementById("reset-ui-confirm");
  if(!modal)return;
  modal.classList.remove("hidden");
}
async function resetAllUISettings(){
  uiSettings={...UI_DEFAULTS};
  try{
    ["ibUiScale","ibFullscreen","ibAnimatedBackground","ibEdgeSwipe","ibEdgeTap","ibBackButton","ibTabSwipe","ibGestureRight","ibOpeningToasts","ibSkipIntro","ibUIStyle","ibUICache","ibLang"].forEach(key=>localStorage.removeItem(key));
    Object.keys(localStorage).filter(key=>key.indexOf("ibI18nCache:")===0).forEach(key=>localStorage.removeItem(key));
  }catch{}
  try{window.i18nClearCache?.()}catch{}
  await persistUISettings();
  location.reload();
}
function initUIReset(){
  const open=document.getElementById("reset-ui-button");
  const cancel=document.getElementById("reset-ui-cancel");
  const confirm=document.getElementById("reset-ui-confirm-button");
  const modal=document.getElementById("reset-ui-confirm");
  if(!open||!cancel||!confirm||!modal)return;
  open.addEventListener("click",openUIResetConfirm);
  cancel.addEventListener("click",closeUIResetConfirm);
  confirm.addEventListener("click",resetAllUISettings);
  modal.addEventListener("click",e=>{if(e.target===modal)closeUIResetConfirm()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))closeUIResetConfirm()});
}
document.addEventListener("DOMContentLoaded",async()=>{
  try{await (window.__ibI18nReady||Promise.resolve())}catch{}
  try{await loadUISettings()}catch{}
  try{if(window.i18nSetLanguage&&uiSettings.lang!==window.__ibI18nState?.lang)await window.i18nSetLanguage(uiSettings.lang)}catch{}
  hideIntro();
  try{initIntegrityCard()}catch(e){console.error("initIntegrityCard",e)}
  try{initTabs()}catch(e){console.error("initTabs",e)}
  try{initHomeSubtabs()}catch(e){console.error("initHomeSubtabs",e)}
  try{initExtractPage()}catch(e){console.error("initExtractPage",e)}
  try{initInterfaceSettings()}catch(e){console.error("initInterfaceSettings",e)}
  try{initLanguageSelector()}catch(e){console.error("initLanguageSelector",e)}
  try{initScale()}catch(e){console.error("initScale",e)}
  try{initUIStyle()}catch(e){console.error("initUIStyle",e)}
  try{initUICache()}catch(e){console.error("initUICache",e)}   try{initUIReset()}catch(e){console.error("initUIReset",e)}
  try{document.getElementById("refresh-announcements")?.addEventListener("click",()=>loadAnnouncements(true))}catch(e){console.error("announcements",e)}
  try{attachButtonListeners()}catch(e){console.error("buttons",e)}
  try{initModal()}catch(e){console.error("modal",e)}
  try{loadAnnouncements()}catch(e){console.error("loadAnnouncements",e)}
  try{updateDashboard()}catch(e){console.error("updateDashboard",e)}
});