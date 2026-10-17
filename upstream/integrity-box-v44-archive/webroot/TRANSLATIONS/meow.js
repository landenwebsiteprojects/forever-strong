(function(){
  "use strict";
  window.i18nDict = window.i18nDict || {};
  var SCRIPT_BASE=(function(){var s=document.currentScript;return s&&s.src?s.src.replace(/\/meow\.js.*$/,"/"):"TRANSLATIONS/";})();
  var CACHE_NAME="integrity-box-ui-v2",CACHE_TTL=86400000,CACHE_PREFIX="ibI18nCache:"; var state = window.__ibI18nState = window.__ibI18nState || { lang:"en", started:false, observer:null, loading:null, switching:null, originals:new WeakMap(), rendered:new WeakMap(), attrs:new WeakMap(), attrRendered:new WeakMap() };

  function normalize(s){
    return String(s ?? "").replace(/\u2018/g,"'").replace(/\u2019/g,"'").replace(/\u201C/g,'"').replace(/\u201D/g,'"').trim();
  }
  function dict(lang){
    var d=window.i18nDict[lang]||{}; var out={};
    Object.keys(d).forEach(function(k){out[normalize(k)]=d[k];});
    return out;
  }
  function fragments(lang){
    var common={"...":"..."};
    if(lang==='tr') return Object.assign(common,{"Analyzing user apps... (":"Kullanıcı uygulamaları analiz ediliyor... (","Checking risky apps... (":"Riskli uygulamalar kontrol ediliyor... ("," installed packages, ":" yüklü paket, ","Found ":"Bulundu "," user apps":" kullanıcı uygulaması","Active: ":"Aktif: ","Loaded: ":"Yüklendi: ","Mapped ":"Eşleştirildi ","Activating ":"Aktifleştiriliyor ","Applying ":"Uygulanıyor "," profile...":" profili..."," profile activated":" profili aktifleştirildi"});
    if(lang==='zh_CN') return Object.assign(common,{"Analyzing user apps... (":"正在分析用户应用... (","Checking risky apps... (":"正在检查风险应用... ("," installed packages, ":" 个已安装包， ","Found ":"找到 "," user apps":" 个用户应用","Active: ":"已激活：","Loaded: ":"已加载：","Mapped ":"已映射 ","Activating ":"正在激活","Applying ":"正在应用"," profile...":" 配置文件..."," profile activated":" 配置文件已激活"});
    if(lang==='ar') return Object.assign(common,{"Analyzing user apps... (":"جارٍ تحليل تطبيقات المستخدم... (","Checking risky apps... (":"جارٍ فحص التطبيقات الخطرة... ("," installed packages, ":" حزمة مثبتة، ","Found ":"تم العثور على "," user apps":" تطبيقات مستخدم","Active: ":"نشط: ","Loaded: ":"تم التحميل: ","Mapped ":"تمت المطابقة: ","Activating ":"جارٍ التفعيل: ","Applying ":"جارٍ التطبيق: "," profile...":" ملف..."," profile activated":" تم تفعيل الملف"});
    if(lang==='es') return Object.assign(common,{"Analyzing user apps... (":"Analizando aplicaciones de usuario... (","Checking risky apps... (":"Comprobando aplicaciones de riesgo... ("," installed packages, ":" paquetes instalados, ","Found ":"Encontradas "," user apps":" aplicaciones de usuario","Active: ":"Activo: ","Loaded: ":"Cargado: ","Mapped ":"Asignado: ","Activating ":"Activando: ","Applying ":"Aplicando: "," profile...":" perfil..."," profile activated":" perfil activado"});
    if(lang==='id') return Object.assign(common,{"Analyzing user apps... (":"Menganalisis aplikasi pengguna... (","Checking risky apps... (":"Memeriksa aplikasi berisiko... ("," installed packages, ":" paket terinstal, ","Found ":"Ditemukan "," user apps":" aplikasi pengguna","Active: ":"Aktif: ","Loaded: ":"Dimuat: ","Mapped ":"Dipetakan: ","Activating ":"Mengaktifkan: ","Applying ":"Menerapkan: "," profile...":" profil..."," profile activated":" profil diaktifkan"});
    if(lang==='pl') return Object.assign(common,{"Analyzing user apps... (":"Analizowanie aplikacji użytkownika... (","Checking risky apps... (":"Sprawdzanie ryzykownych aplikacji... ("," installed packages, ":" zainstalowanych pakietów, ","Found ":"Znaleziono "," user apps":" aplikacji użytkownika","Active: ":"Aktywne: ","Loaded: ":"Załadowane: ","Mapped ":"Zmapowane: ","Activating ":"Aktywowanie: ","Applying ":"Stosowanie: "," profile...":" profilu..."," profile activated":" profil aktywowany"});
    if(lang==='ru') return Object.assign(common,{"Analyzing user apps... (":"Анализ приложений пользователя... (","Checking risky apps... (":"Проверка рискованных приложений... ("," installed packages, ":" установленных пакетов, ","Found ":"Найдено "," user apps":" пользовательских приложений","Active: ":"Активно: ","Loaded: ":"Загружено: ","Mapped ":"Сопоставлено: ","Activating ":"Активация: ","Applying ":"Применение: "," profile...":" профиля..."," profile activated":" профиль активирован"});
    if(lang==='de') return Object.assign(common,{"Analyzing user apps... (":"Benutzer-Apps werden analysiert... (","Checking risky apps... (":"Riskante Apps werden geprüft... ("," installed packages, ":" installierte Pakete, ","Found ":"Gefunden: "," user apps":" Benutzer-Apps","Active: ":"Aktiv: ","Loaded: ":"Geladen: ","Mapped ":"Zugeordnet: ","Activating ":"Aktiviere Profil ","Applying ":"Profil wird angewendet: "," profile...":"..."," profile activated":" – Profil aktiviert","Key: ":"Schlüssel: ","Size: ":"Größe: ","Keybox set to ":"Keybox festgelegt für ","Backup saved to ":"Backup gespeichert unter ","Did you mean:":"Meintest du:","Scan failed: ":"Scan fehlgeschlagen: ","Set keybox failed: ":"Keybox konnte nicht festgelegt werden: ","Complete file • ":"Vollständige Datei • ","Log directory does not exist: ":"Protokollverzeichnis existiert nicht: ","Log path is not a directory: ":"Protokollpfad ist kein Verzeichnis: ","Permission denied while accessing: ":"Zugriff verweigert auf: "," January 20":" Januar 20"," February 20":" Februar 20"," March 20":" März 20"," April 20":" April 20"," May 20":" Mai 20"," June 20":" Juni 20"," July 20":" Juli 20"," August 20":" August 20"," September 20":" September 20"," October 20":" Oktober 20"," November 20":" November 20"," December 20":" Dezember 20"});
    if(lang==='ro') return Object.assign(common,{"Analyzing user apps... (":"Se analizează aplicațiile utilizatorului... (","Checking risky apps... (":"Se verifică aplicațiile riscante... ("," installed packages, ":" pachete instalate, ","Found ":"Găsite: "," user apps":" aplicații de utilizator","Active: ":"Activ: ","Loaded: ":"Încărcat: ","Mapped ":"Mapat: ","Activating ":"Se activează profilul ","Applying ":"Se aplică profilul "," profile...":"..."," profile activated":" – profil activat","Key: ":"Cheie: ","Size: ":"Dimensiune: ","Keybox set to ":"Keybox setat pentru ","Backup saved to ":"Backup salvat în ","Did you mean:":"Te-ai referit la:","Scan failed: ":"Scanare eșuată: ","Set keybox failed: ":"Setarea keybox-ului a eșuat: ","Complete file • ":"Fișier complet • ","Log directory does not exist: ":"Directorul de jurnale nu există: ","Log path is not a directory: ":"Calea jurnalelor nu este un director: ","Permission denied while accessing: ":"Acces refuzat la: "," January 20":" ianuarie 20"," February 20":" februarie 20"," March 20":" martie 20"," April 20":" aprilie 20"," May 20":" mai 20"," June 20":" iunie 20"," July 20":" iulie 20"," August 20":" august 20"," September 20":" septembrie 20"," October 20":" octombrie 20"," November 20":" noiembrie 20"," December 20":" decembrie 20"});
    if(lang==='hu') return Object.assign(common,{"Analyzing user apps... (":"Felhasználói appok elemzése... (","Checking risky apps... (":"Kockázatos appok ellenőrzése... ("," installed packages, ":" telepített csomag, ","Found ":"Találat: "," user apps":" felhasználói app","Active: ":"Aktív: ","Loaded: ":"Betöltve: ","Mapped ":"Hozzárendelve: ","Activating ":"Profil aktiválása: ","Applying ":"Profil alkalmazása: "," profile...":"..."," profile activated":" profil aktiválva","Key: ":"Kulcs: ","Size: ":"Méret: ","Keybox set to ":"Keybox beállítva: ","Backup saved to ":"Mentés helye: ","Did you mean:":"Erre gondoltál:","Scan failed: ":"Keresés sikertelen: ","Set keybox failed: ":"Nem sikerült beállítani a keyboxot: ","Complete file • ":"Teljes fájl • ","Log directory does not exist: ":"A naplómappa nem létezik: ","Log path is not a directory: ":"A naplóútvonal nem mappa: ","Permission denied while accessing: ":"Hozzáférés megtagadva: "," January 20":" január 20"," February 20":" február 20"," March 20":" március 20"," April 20":" április 20"," May 20":" május 20"," June 20":" június 20"," July 20":" július 20"," August 20":" augusztus 20"," September 20":" szeptember 20"," October 20":" október 20"," November 20":" november 20"," December 20":" december 20"});
    if(lang==='it') return Object.assign(common,{"Analyzing user apps... (":"Analisi delle app utente... (","Checking risky apps... (":"Verifica delle app rischiose... ("," installed packages, ":" pacchetti installati, ","Found ":"Trovati "," user apps":" app utente","Active: ":"Attivo: ","Loaded: ":"Caricati: ","Mapped ":"Mappati: ","Activating ":"Attivazione profilo ","Applying ":"Applicazione profilo "," profile...":"..."," profile activated":" – profilo attivato","Key: ":"Chiave: ","Size: ":"Dimensione: ","Keybox set to ":"Keybox impostata per ","Backup saved to ":"Backup salvato in ","Did you mean:":"Forse intendevi:","Scan failed: ":"Scansione non riuscita: ","Set keybox failed: ":"Impostazione keybox non riuscita: ","Complete file • ":"File completo • ","Log directory does not exist: ":"La cartella dei log non esiste: ","Log path is not a directory: ":"Il percorso dei log non è una cartella: ","Permission denied while accessing: ":"Permesso negato durante l’accesso a: "," January 20":" gennaio 20"," February 20":" febbraio 20"," March 20":" marzo 20"," April 20":" aprile 20"," May 20":" maggio 20"," June 20":" giugno 20"," July 20":" luglio 20"," August 20":" agosto 20"," September 20":" settembre 20"," October 20":" ottobre 20"," November 20":" novembre 20"," December 20":" dicembre 20"});
    if(lang==='nl') return Object.assign(common,{"Analyzing user apps... (":"Gebruikersapps analyseren... (","Checking risky apps... (":"Riskante apps controleren... ("," installed packages, ":" geïnstalleerde pakketten, ","Found ":"Gevonden: "," user apps":" gebruikersapps","Active: ":"Actief: ","Loaded: ":"Geladen: ","Mapped ":"Gekoppeld: ","Activating ":"Profiel activeren: ","Applying ":"Profiel toepassen: "," profile...":"..."," profile activated":" – profiel geactiveerd","Key: ":"Key: ","Size: ":"Grootte: ","Keybox set to ":"Keybox ingesteld voor ","Backup saved to ":"Back-up opgeslagen in ","Did you mean:":"Bedoelde je:","Scan failed: ":"Scan mislukt: ","Set keybox failed: ":"Keybox instellen mislukt: ","Complete file • ":"Volledig bestand • ","Log directory does not exist: ":"Logmap bestaat niet: ","Log path is not a directory: ":"Logpad is geen map: ","Permission denied while accessing: ":"Toegang geweigerd tot: "," January 20":" januari 20"," February 20":" februari 20"," March 20":" maart 20"," April 20":" april 20"," May 20":" mei 20"," June 20":" juni 20"," July 20":" juli 20"," August 20":" augustus 20"," September 20":" september 20"," October 20":" oktober 20"," November 20":" november 20"," December 20":" december 20"});
    if(lang==='pt_BR') return Object.assign(common,{"Analyzing user apps... (":"Analisando apps de usuário... (","Checking risky apps... (":"Verificando apps de risco... ("," installed packages, ":" pacotes instalados, ","Found ":"Encontrados: "," user apps":" apps de usuário","Active: ":"Ativo: ","Loaded: ":"Carregado: ","Mapped ":"Mapeados: ","Activating ":"Ativando perfil ","Applying ":"Aplicando perfil "," profile...":"..."," profile activated":" – perfil ativado","Key: ":"Chave: ","Size: ":"Tamanho: ","Keybox set to ":"Keybox definida para ","Backup saved to ":"Backup salvo em ","Did you mean:":"Você quis dizer:","Scan failed: ":"Falha no scan: ","Set keybox failed: ":"Falha ao definir a keybox: ","Complete file • ":"Arquivo completo • ","Log directory does not exist: ":"O diretório de logs não existe: ","Log path is not a directory: ":"O caminho dos logs não é um diretório: ","Permission denied while accessing: ":"Permissão negada ao acessar: "," January 20":" de janeiro de 20"," February 20":" de fevereiro de 20"," March 20":" de março de 20"," April 20":" de abril de 20"," May 20":" de maio de 20"," June 20":" de junho de 20"," July 20":" de julho de 20"," August 20":" de agosto de 20"," September 20":" de setembro de 20"," October 20":" de outubro de 20"," November 20":" de novembro de 20"," December 20":" de dezembro de 20"});
    return common;
  }
  function tr(value,lang){
    var raw=String(value ?? ""), key=normalize(raw), d=dict(lang);
    if(d[key]!==undefined) return d[key];
    var q=normalize(key); if(d[q]!==undefined) return d[q];
    var out=raw, fr=fragments(lang); Object.keys(fr).forEach(function(k){if(out.indexOf(k)!==-1)out=out.split(k).join(fr[k]);});
    return out;
  }
  function skipElement(el){
    if(!el||el.nodeType!==1)return true;
    if(el.closest&&el.closest('.i18n-skip,#lang-dropdown-community,.lang-dropdown-inline,.material-icons,.material-symbols-outlined,.material-icons-round'))return true;
    if(el.matches('script,style,noscript,code,pre,textarea'))return true;
    return false;
  }
  function sourceText(node){
    if(!state.originals.has(node)) state.originals.set(node,node.nodeValue);
    return state.originals.get(node);
  }
  function applyText(node,lang){
    if(!node||node.nodeType!==3)return;
    var p=node.parentElement; if(!p||skipElement(p))return;
    var last=state.rendered.get(node);
    if(last!==undefined && node.nodeValue!==last) state.originals.set(node,node.nodeValue);
    var src=sourceText(node); if(!src||!src.trim())return;
    var translated=lang==='en'?src:tr(src,lang);
    state.rendered.set(node,translated);
    if(node.nodeValue!==translated)node.nodeValue=translated;
  }
  function applyAttr(el,name,lang){
    if(skipElement(el))return;
    var value=el.getAttribute(name); if(value==null||!value.trim())return;
    var map=state.attrs.get(el); if(!map){map={};state.attrs.set(el,map);}
    if(map[name]===undefined)map[name]=value;
    var rendered=state.attrRendered.get(el)||{};
    if(rendered[name]!==undefined && value!==rendered[name]) map[name]=value;
    var src=map[name];
    if(name==='value' && !/^(button|submit|reset)$/i.test(el.type||''))return;
    var translated=lang==='en'?src:tr(src,lang);
    rendered[name]=translated; state.attrRendered.set(el,rendered);
    el.setAttribute(name,translated);
  }
  function apply(root,lang){
    if(!root)return;
    var wasObserving=!!state.observer;
    if(wasObserving){state.observer.disconnect();state.observer=null;}
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return (!n.nodeValue||!n.nodeValue.trim()||skipElement(n.parentElement))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    var nodes=[]; while(walker.nextNode())nodes.push(walker.currentNode); nodes.forEach(function(n){applyText(n,lang);});
    var els=root.querySelectorAll?root.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type="button"],input[type="submit"],input[type="reset"]'):[];
    Array.prototype.forEach.call(els,function(e){['placeholder','title','aria-label','alt','value'].forEach(function(a){applyAttr(e,a,lang);});});
    if(wasObserving) observe();
  }
  function patchPopup(){
    if(typeof window.popup!=='function'||window.popup.__ibWrapped)return;
    var orig=window.popup;
    function wrapped(msg,type){return orig.call(this,tr(msg,state.lang),type);}
    wrapped.__ibWrapped=true; window.popup=wrapped;
  }
  function observe(){
    if(state.observer||!document.body)return;
    state.observer=new MutationObserver(function(ms){
      ms.forEach(function(m){
        if(m.type==='characterData'){applyText(m.target,state.lang);return;}
        Array.prototype.forEach.call(m.addedNodes,function(n){if(n.nodeType===1)apply(n,state.lang);else if(n.nodeType===3)applyText(n,state.lang);});
      });
    });
    state.observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  function cacheEnabled(){
    try{return localStorage.getItem('ibUICache')!=='0'}catch(e){return true}
  }
  function cacheUrl(lang){return new URL(encodeURIComponent(lang)+'.js',SCRIPT_BASE).href;}
  function cacheKey(lang){return CACHE_PREFIX+lang;}
  function readLocalCache(lang){
    if(!cacheEnabled())return null;
    try{
      var raw=localStorage.getItem(cacheKey(lang)); if(!raw)return null;
      var data=JSON.parse(raw); if(!data||!data.dict||!data.savedAt)return null;
      window.i18nDict[lang]=data.dict;
      if(Date.now()-Number(data.savedAt)>CACHE_TTL)return {dict:data.dict,stale:true}; return {dict:data.dict,stale:false};
    }catch(e){return null}
  }
  function writeLocalCache(lang,data){
    if(!cacheEnabled())return;
    try{localStorage.setItem(cacheKey(lang),JSON.stringify({savedAt:Date.now(),dict:data||{}}))}catch(e){}
  }
  async function readApiCache(lang){
    if(!cacheEnabled()||!('caches' in window))return null;
    try{
      var cache=await caches.open(CACHE_NAME),res=await cache.match(cacheUrl(lang));
      if(!res)return null;
      var text=await res.text(),savedAt=Number(res.headers.get('x-ib-cached-at')||0);
      if(!text)return null;
      if(savedAt&&Date.now()-savedAt>CACHE_TTL)return {text:text,stale:true};
      return {text:text,stale:false};
    }catch(e){return null}
  }
  function evaluate(text,lang){
    try{new Function(text)(); return !!window.i18nDict[lang]}catch(e){return false}
  }
  async function writeApiCache(lang,response,text){
    if(!cacheEnabled()||!('caches' in window))return;
    try{
      var headers=new Headers(response.headers); headers.set('x-ib-cached-at',String(Date.now()));
      var cachedResponse=new Response(text,{status:response.status,statusText:response.statusText,headers:headers});
      var cache=await caches.open(CACHE_NAME); await cache.put(cacheUrl(lang),cachedResponse);
    }catch(e){}
  }
  async function refresh(lang){
    if(!cacheEnabled())return;
    try{
      var response=await fetch(cacheUrl(lang),{cache:'reload'});
      if(!response.ok)throw new Error('Translation request failed');
      var text=await response.text();
      if(!evaluate(text,lang))throw new Error('Invalid translation');
      writeLocalCache(lang,window.i18nDict[lang]);
      await writeApiCache(lang,response,text);
    }catch(e){}
  }
  async function load(lang){
    if(lang==='en')return Promise.resolve();
    if(window.i18nDict[lang])return Promise.resolve();
    if(state.loading&&state.loading.lang===lang)return state.loading.promise;
    var p=(async function(){
      var local=readLocalCache(lang);
      if(local){
        if(local.stale)refresh(lang);
        return;
      }
      var cached=await readApiCache(lang);
      if(cached&&evaluate(cached.text,lang)){
        writeLocalCache(lang,window.i18nDict[lang]);
        if(cached.stale)refresh(lang);
        return;
      }
      try{
        var response=await fetch(cacheUrl(lang),{cache:'reload'});
        if(!response.ok)throw new Error('Translation request failed');
        var text=await response.text();
        if(!evaluate(text,lang))throw new Error('Invalid translation');
        if(cacheEnabled()){
          writeLocalCache(lang,window.i18nDict[lang]);
          await writeApiCache(lang,response,text);
        }
        return;
      }catch(e){
        var fallback=await readApiCache(lang);
        if(fallback&&evaluate(fallback.text,lang))return;
        await new Promise(function(resolve,reject){
          var s=document.createElement('script');
          s.src=cacheUrl(lang);
          s.onload=resolve;
          s.onerror=reject;
          document.head.appendChild(s);
        });
        if(!window.i18nDict[lang])throw e;
        if(cacheEnabled())writeLocalCache(lang,window.i18nDict[lang]);
      }
    })();
    state.loading={lang:lang,promise:p}; return p.finally(function(){state.loading=null;});
  }
  function clearPending(){
    document.documentElement.classList.remove('i18n-pending');
  }
  window.i18nSetLanguage=function(lang){
    lang=lang||'en';
    if(state.switching&&state.switching.lang===lang)return state.switching.promise;
    var requested=lang;
    var promise=load(lang).catch(function(){lang='en';}).then(function(){
      state.lang=lang;
      if(lang===requested){try{localStorage.setItem('ibLang',lang)}catch(e){}}
      applyLanguageDirection(lang);
      apply(document.body,lang);
      patchPopup();
      clearPending();
      window.dispatchEvent(new CustomEvent('ibLanguageChanged',{detail:{lang:lang}}));
      return lang;
    }).finally(function(){state.switching=null;});
    state.switching={lang:lang,promise:promise};
    return promise;
  };
  window.i18nBoot=function(lang){
    if(state.started){return window.i18nSetLanguage(lang||state.lang);}
    state.started=true; observe(); return window.i18nSetLanguage(lang||state.lang);
  };
  function applyLanguageDirection(lang){var rtl=['ar','fa','he','ur'].indexOf(String(lang||'').toLowerCase())>=0;document.documentElement.dir=rtl?'rtl':'ltr';document.body&& (document.body.dir=rtl?'rtl':'ltr');document.documentElement.classList.toggle('rtl',rtl);document.documentElement.classList.toggle('ltr',!rtl);}
  window.addEventListener('message',function(e){if(e.data&&e.data.type==='ibLangChange')window.i18nSetLanguage(e.data.lang);});
  function bindLanguageSelector(){
    var select=document.getElementById('lang-dropdown-community');
    if(!select||select.__ibLiveLanguageBound)return;
    select.__ibLiveLanguageBound=true;
    select.addEventListener('change',function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      var lang=select.value||'en';
      try{localStorage.setItem('ibLang',lang)}catch(err){}
      window.i18nSetLanguage(lang);
    },true);
  }
  function savedLanguage(){
    try{
      var saved=localStorage.getItem('ibLang');
      if(saved&&/^[a-z]{2}(?:_[A-Z]{2})?$/.test(saved))return saved;
    }catch(e){}
    return 'en';
  }
  function seedCachedLanguage(lang){
    if(lang==='en'||!cacheEnabled())return false;
    var cached=readLocalCache(lang);
    if(cached&&cached.dict){
      state.lang=lang;
      applyLanguageDirection(lang);
      return true;
    }
    return false;
  }
  function boot(){
    bindLanguageSelector();
    var saved=savedLanguage();
    state.lang=saved;
    if(saved!=='en'){
      if(!seedCachedLanguage(saved))document.documentElement.classList.add('i18n-pending');
      state.started=true;
      observe();
      window.__ibI18nReady=window.i18nBoot(saved);
    }else{
      state.started=true;
      observe();
      patchPopup();
      applyLanguageDirection('en');
      clearPending();
      window.__ibI18nReady=Promise.resolve('en');
    }
  }
  window.i18nEnsureCached=function(lang){
    if(!cacheEnabled()||!lang||lang==='en')return Promise.resolve();
    var local=readLocalCache(lang);
    if(local&&!local.stale)return Promise.resolve();
    if(local&&local.stale)return refresh(lang);
    if(window.i18nDict[lang]){
      writeLocalCache(lang,window.i18nDict[lang]);
      return refresh(lang);
    }
    return load(lang);
  };
  window.i18nClearCache=function(){
    try{Object.keys(localStorage).filter(function(k){return k.indexOf(CACHE_PREFIX)===0;}).forEach(function(k){localStorage.removeItem(k)})}catch(e){}
  };
  boot();
})();
