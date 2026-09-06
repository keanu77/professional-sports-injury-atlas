import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '/Users/ethanstudio/Documents/Vibe coding/professional-sports injury/node_modules/@playwright/test/index.mjs';
const origin=process.argv[2]??'http://127.0.0.1:14324';
const receipt=JSON.parse(fs.readFileSync(process.argv[3]??'/tmp/atlas23-checkout/artifacts/public-launch-receipt.v1.json'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const result={origin,checkedAt:new Date().toISOString(),clipBounds:[],allPages:0};
try {
 const page=await browser.newPage({viewport:{width:320,height:900}});
 await page.addInitScript(()=>{localStorage.setItem('atlas-theme','dark');localStorage.setItem('atlas-font-scale','1.5');window.events=[];window.YT={Player:class{constructor(el,opts){window.events.push(opts.events);setTimeout(()=>opts.events.onReady({}),0);}}};});
 await page.route('https://www.youtube-nocookie.com/**',r=>r.abort());
 for(const clip of receipt.clips){
  await page.goto(origin+'/videos/'+clip.slug+'/');
  const button=page.locator('[data-video-load]');await button.scrollIntoViewIfNeeded();
  const geometry=await button.evaluate(e=>{const r=e.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(e);return {button:r.toJSON(),text:[...range.getClientRects()].map(r=>r.toJSON()),clippedAncestor:!!e.closest('[data-video-thumbnail]')};});
  assert.equal(geometry.clippedAncestor,false);
  for(const r of geometry.text){assert.ok(r.left>=geometry.button.left-1&&r.right<=geometry.button.right+1&&r.top>=geometry.button.top-1&&r.bottom<=geometry.button.bottom+1,clip.slug+' button text clipped');}
  const source=new URL(await page.locator('.clip-source a').getAttribute('href'));assert.equal(Number(source.searchParams.get('t')??0),clip.startSeconds);
  result.clipBounds.push({slug:clip.slug,passed:true,startSeconds:clip.startSeconds});
 }
 await page.goto(origin+'/cases/anfernee-simons-ankle-sprain-2023/');
 const button=page.locator('[data-video-load]');await page.keyboard.press('Tab');await button.focus();
 const focus=await button.evaluate(e=>({offset:parseFloat(getComputedStyle(e).outlineOffset),width:parseFloat(getComputedStyle(e).outlineWidth),visible:e.matches(':focus-visible')}));
 assert.ok(focus.visible && focus.offset<=-focus.width);result.focus=focus;
 await button.click();await page.waitForFunction(()=>document.querySelector('[data-video-embed]').dataset.videoState==='ready');
 await page.evaluate(()=>window.events[0].onError({data:150}));
 assert.equal(await page.locator('[data-video-embed]').getAttribute('data-video-state'),'failed');assert.equal(await page.locator('iframe').count(),0);assert.ok(await button.isVisible());
 await button.click();await page.waitForFunction(()=>document.querySelector('[data-video-embed]').dataset.videoState==='ready');
 await page.evaluate(()=>window.events[0].onError({data:150}));assert.equal(await page.locator('[data-video-embed]').getAttribute('data-video-state'),'ready');result.lateErrorRetry='passed';
 for(const file of receipt.files.filter(f=>f.path.endsWith('.html'))){
  const path='/'+file.path.replace(/index\.html$/,'');await page.goto(origin+path);
  assert.equal(await page.getByRole('searchbox').count(),0);assert.equal(await page.getByRole('combobox').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,path);
  assert.ok(await page.getByRole('link',{name:'返回吳易澄醫師網站',exact:true}).isVisible());
  if(path.startsWith('/cases/'))assert.ok(await page.locator('[data-visible-observation]').isVisible());
  result.allPages++;
 }
 await page.goto(origin+'/injuries/acl/');
 assert.ok(await page.getByRole('heading',{name:'先做這幾件事',exact:true}).isVisible());
 const headings=await page.locator('h2').allTextContents();assert.ok(headings.findIndex(x=>x.includes('先做這幾件事'))<headings.findIndex(x=>x.includes('案例列表')));result.aclGuideFirst=true;
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(origin+'/videos/'+receipt.clips[0].slug+'/');assert.equal(await nojs.locator('[data-video-load]:visible').count(),0);assert.ok(await nojs.locator('.clip-source a').isVisible());result.nojs='passed';
 console.log(JSON.stringify(result));
 fs.writeFileSync('/tmp/atlas26-regression.json',JSON.stringify(result,null,2)+'\n');
} finally {await browser.close();}
