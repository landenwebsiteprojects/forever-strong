/* Shared WebUI architecture descriptor. No fictional standalone module is created. */
(() => {
 const root='/data/adb/modules/halloweenedition';
 window.heIntegration=Object.freeze({
  owner:'halloweenedition',kind:'TrickyStoreOSS',root,engine:root+'/tricky',config:'/data/adb/tricky_store',controller:root+'/bin/control.sh',
  call(operation,...args){
   const host=window.parent!==window?window.parent:window;
   if(typeof host.heEngine!=='function')return Promise.reject(new Error('Open this tool through the unified ForeverStrong WebUI.'));
   return host.heEngine(operation,...args);
  },
  parse(text){const result={};String(text).split('\n').forEach(line=>{const pos=line.indexOf('=');if(pos>0)result[line.slice(0,pos)]=line.slice(pos+1);});return result;}
 });
})();
