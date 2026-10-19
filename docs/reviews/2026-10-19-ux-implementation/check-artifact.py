from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json,sys,struct
root=Path(sys.argv[1]); mode=sys.argv[2]
class Doc(HTMLParser):
 def __init__(self,path):
  super().__init__(); self.path=path; self.ids=set(); self.refs=[]; self.meta={}; self.cards=0; self.frames=0; self.executable_inline=0; self.script=False; self.duplicate_ids=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   if a['id'] in self.ids: self.duplicate_ids.append(a['id'])
   self.ids.add(a['id'])
  if tag=='a' and 'href' in a: self.refs.append(('link',a['href']))
  if tag in ['img','script','source'] and 'src' in a: self.refs.append(('asset',a['src']))
  if tag=='link' and a.get('rel') in ['stylesheet','modulepreload','preload']: self.refs.append(('asset',a.get('href','')))
  if tag=='meta': self.meta[a.get('property',a.get('name',''))]=a.get('content','')
  if 'data-video-card' in a: self.cards+=1
  if tag=='iframe': self.frames+=1
  if tag=='script': self.script='src' not in a and a.get('type','') not in ['application/ld+json','application/json']
 def handle_endtag(self,tag):
  if tag=='script': self.script=False
 def handle_data(self,data):
  if self.script and data.strip(): self.executable_inline+=1
pages={}
for p in root.rglob('*.html'):
 d=Doc(p); d.feed(p.read_text()); pages[p.resolve()]=d
issues=[]
fixture_links=[]
for p,d in pages.items():
 for kind,ref in d.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc or not u.path: continue
  target=(root/u.path.lstrip('/') if u.path.startswith('/') else p.parent/u.path).resolve()
  if target.is_dir(): target=target/'index.html'
  if not target.exists():
   finding=[str(p.relative_to(root)),kind,ref,'missing']
   (fixture_links if p.relative_to(root).parts[:2]==('review','fixtures') else issues).append(finding)
  elif kind=='link' and u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:
   issues.append([str(p.relative_to(root)),kind,ref,'missing anchor'])
 if d.duplicate_ids: issues.append([str(p.relative_to(root)),'duplicate ids',d.duplicate_ids])
 if d.frames or d.executable_inline: issues.append([str(p.relative_to(root)),'initial iframe/executable inline',d.frames,d.executable_inline])
 if mode=='public':
  image=d.meta.get('og:image')
  if image:
   target=root/urlsplit(image).path.lstrip('/')
   if not target.exists(): issues.append([str(p.relative_to(root)),'og missing',image])
   elif '/social/cases/' in image or '/social/videos/' in image:
    b=target.read_bytes()
    if struct.unpack('>II',b[16:24])!=(1200,630): issues.append([str(p.relative_to(root)),'og dimensions'])
 else:
  if d.meta.get('robots')!='noindex,nofollow,noarchive,nosnippet,noimageindex': issues.append([str(p.relative_to(root)),'review robots',d.meta.get('robots')])
summary={'mode':mode,'pages':len(pages),'detailPages':sum(1 for p in pages if p.relative_to(root).parts[0] in ['cases','videos']),'sharePNGs':len(list((root/'social/cases').glob('*.png')))+len(list((root/'social/videos').glob('*.png'))),'homepageSSRcards':pages[(root/'index.html').resolve()].cards,'excludedFictionalFixtureLinks':fixture_links,'issues':issues}
print(json.dumps(summary,ensure_ascii=False,indent=2)); sys.exit(bool(issues))
