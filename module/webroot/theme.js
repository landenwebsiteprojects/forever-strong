/* Appearance is local to this WebUI host; shared with all embedded controls. */
(() => {
 const KEY='fs-theme-v1',defaults={background:'#151515',accent:'#ff7900'};
 const valid=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const hex=values=>'#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
 const mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
 const luminance=values=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return {background:valid(value.background)?value.background:defaults.background,accent:valid(value.accent)?value.accent:defaults.accent};}catch{return {...defaults};}};
 function apply(){
  const colors=read(),bg=rgb(colors.background),accent=rgb(colors.accent),light=luminance(bg)>.35;
  const foreground=light?[25,25,25]:[245,245,245],panel=mix(bg,light?[0,0,0]:[255,255,255],.055);
  const variables={bg:colors.background,panel:hex(panel),accent:colors.accent,warm:colors.accent==='\x23ff7900'?'#ff9e32':hex(mix(accent,light?[0,0,0]:[255,255,255],.2)),text:hex(foreground),muted:hex(mix(bg,foreground,.68)),line:hex(mix(bg,foreground,.17)),'accent-rgb':accent.join(','),'on-accent':luminance(accent)>.179?'#151515':'#ffffff','surface':hex(mix(bg,foreground,.035)),'accent-soft':`rgba(${accent.join(',')},.10)`};
  for(const [key,value] of Object.entries(variables))document.documentElement.style.setProperty('--'+key,value);
  document.documentElement.style.colorScheme=light?'light':'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors.background);
  document.dispatchEvent(new CustomEvent('fs-theme-change',{detail:colors}));
  return colors;
 }
 window.fsTheme={read,apply,defaults,set(value){if(!valid(value.background)||!valid(value.accent))throw Error('Choose valid theme colors.');localStorage.setItem(KEY,JSON.stringify(value));apply();},reset(){localStorage.removeItem(KEY);apply();}};
 apply();window.addEventListener('storage',event=>{if(event.key===KEY)apply();});
})();
