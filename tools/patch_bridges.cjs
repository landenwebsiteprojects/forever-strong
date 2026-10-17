// Requires acorn. Preserve code outside audited shell adapters, then modernize synchronous callers.
const fs=require('fs'),path=require('path');const acorn=require(process.env.HE_ACORN||'acorn');
const root=path.join(__dirname,'../module/webroot');
function visit(node,parent,all,parents){if(!node||typeof node!=='object')return;if(node.type){all.push(node);parents.set(node,parent);}for(const [key,value]of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(n=>visit(n,node,all,parents));else if(value&&typeof value==='object')visit(value,node,all,parents);}}
for(const name of fs.readdirSync(root)){
 const file=path.join(root,name,'index.html');if(!fs.existsSync(file)||name==='Credits')continue;
 let html=fs.readFileSync(file,'utf8');html=html.replace(/<script>([\s\S]*?)<\/script>/g,(whole,code)=>{
  let tree;try{tree=acorn.parse(code,{ecmaVersion:'latest'});}catch(e){throw new Error(name+': '+e.message);}
  let edits=[];
  for(const f of tree.body){
   if(f.type!=='FunctionDeclaration')continue;const n=f.id.name;
   if(['sh','runCmd'].includes(n)&&f.params[0]?.name==='cmd'&&name!=='PropSpoofer')edits.push([f.start,f.end,`function ${n}(cmd){return window.heShell(cmd);}`]);
   if(n==='run'&&f.params[1]?.name==='cb')edits.push([f.start,f.end,`function run(cmd,cb){return window.heShell(cmd).then(out=>{if(cb)cb(out);return out;});}`]);
   if(n==='runShell'){
    if(['Control','KeyboxSource','RootImplementation'].includes(name))continue;
    if(['Pilot'].includes(name))edits.push([f.start,f.end,'function runShell(cmd,cb){return window.heShell(cmd).then(out=>{if(cb)cb(out);return out;});}']);
    else if(['Pixel','TrickyStore'].includes(name))edits.push([f.start,f.end,'function runShell(cmd,cb){return window.heShell(cmd).then(out=>{if(cb)cb(0,out,"");return out;},err=>{if(cb)cb(1,"",err.message);throw err;});}']);
    else edits.push([f.start,f.end,'function runShell(cmd){return window.heShell(cmd);}']);
   }
   if(name==='RepairMode'&&n==='exec')edits.push([f.start,f.end,'function exec(cmd){return window.heShell(cmd);}']);
  }
  for(const [a,b,s]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+s+code.slice(b);
  if(!['Profile','Spoofing','Downloader'].includes(name))return '<script>'+code+'</script>';
  // Convert synchronous bridge clients and their direct callers to await the actual command result.
  tree=acorn.parse(code,{ecmaVersion:'latest'});const all=[],parents=new Map;visit(tree,null,all,parents);
  const funcs=all.filter(n=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type));
  function owner(n){while(n){n=parents.get(n);if(funcs.includes(n))return n;}return null;}
  const asyncFunctions=new Set(funcs.filter(f=>f.async)),names=new Set(['sh']);
  let change=true;while(change){change=false;for(const n of all){if(n.type!=='CallExpression'||n.callee.type!=='Identifier'||!names.has(n.callee.name))continue;const f=owner(n);if(f&&!asyncFunctions.has(f)){asyncFunctions.add(f);if(f.id)names.add(f.id.name);change=true;}}}
  edits=[];
  for(const f of asyncFunctions){if(!f.async)edits.push([f.start,f.start,'async ']);}
  for(const n of all){if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&names.has(n.callee.name)&&parents.get(n)?.type!=='AwaitExpression'&&owner(n))edits.push([n.start,n.start,'await ']);}
  for(const [a,b,s]of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,a)+s+code.slice(b);
  acorn.parse(code,{ecmaVersion:'latest'});
  return '<script>'+code+'</script>';
 });
 fs.writeFileSync(file,html);
}
