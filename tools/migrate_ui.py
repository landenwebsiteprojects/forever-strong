#!/usr/bin/env python3
"""Rebuild v44 component presentation while retaining feature DOM and JS actions."""
from pathlib import Path
import re, shutil
from bs4 import BeautifulSoup, Doctype
root=Path(__file__).resolve().parents[1]/'module/webroot'
boot=root/'BootConfiguration';boot.mkdir(exist_ok=True)
# This original is copied into the source project by the source assembly step.
src=Path(__file__).resolve().parents[1]/'upstream/integrity-box-v44-archive/toolkit/BootConfiguration/index.html'
if src.exists(): shutil.copyfile(src,boot/'index.html')
for p in root.glob('*/index.html'):
 if p.parent.name=='Credits':continue
 soup=BeautifulSoup(p.read_text(),'html.parser')
 if soup.select_one('.he-component-header'):continue
 for tag in soup.select('style,link[rel=stylesheet]'):tag.decompose()
 for tag in list(soup.select('script')):
  if tag.get('src') or 'TRANSLATIONS/' in tag.text: tag.decompose()
 for tag in soup.select('img'):
  if re.search('cat|meow',tag.get('src',''),re.I):tag['src']='../pumpkin.svg'
 for text in soup.find_all(string=True):
  if isinstance(text,Doctype) or text.parent.name in ['script','style']:continue
  text.replace_with(re.sub('meow(?:na|dump)?','Pumpkin',str(text),flags=re.I))
 soup.title.string='Halloween Edition · '+p.parent.name
 for href in ['../halloween.css','../components.css']:
  tag=soup.new_tag('link',rel='stylesheet',href=href);soup.head.append(tag)
 bridge=soup.new_tag('script',src='../component-bridge.js');soup.head.append(bridge)
 soup.body['class']=list(soup.body.get('class',[]))+['component']
 header=soup.new_tag('header',attrs={'class':'he-component-header'})
 header.append(BeautifulSoup('<img src="../pumpkin.svg" alt="Pumpkin"><div><p>HALLOWEEN EDITION / CONTROL CENTER</p><h1>'+p.parent.name+'</h1></div>','html.parser'))
 soup.body.insert(0,header)
 # Keep inline visibility; remove old visual presentation and forced horizontal dimensions.
 for e in soup.select('[style]'):
  keep=[]
  for part in e['style'].split(';'):
   if ':' not in part:continue
   k,v=part.split(':',1);k=k.strip()
   if k in ['display','visibility','pointer-events','opacity']: keep.append(k+':'+v)
  if keep:e['style']=';'.join(keep)
  else:del e['style']
 s=str(soup).replace('/data/adb/modules/playintegrityfix','/data/adb/modules/halloweenedition')
 s=s.replace('/halloweenedition/action.sh','/halloweenedition/integrity-action.sh')
 s=s.replace('powered by IntegrityBox','Halloween Edition v1.0')
 p.write_text(s)
print('Rebuilt component presentation')
