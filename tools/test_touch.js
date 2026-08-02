/* 실제 터치 입력으로 손패 조작을 검사한다 (CDP Input.dispatchTouchEvent).
 *   node tools/test_touch.js
 * ⚠ Playwright 의 mouse API 는 pointerType=mouse 라 :hover 가 걸린다 —
 *   휴대폰에서만 나는 증상(확대가 남아 드래그를 먹는 문제 등)은 여기서만 잡힌다. */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
  isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'});
const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const cdp=await ctx.newCDPSession(p);
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,
  touchPoints:type==='touchEnd'?[]:[{x,y,radiusX:12,radiusY:12,force:1,id:1}]});
await p.goto(FILE);await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(250);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
await p.evaluate(()=>{
  while(S.me.lands.length<5){S.me.landPlayed=false;const j=S.me.hand.findIndex(isLand);
    if(j<0)break;playLand('me',S.me.hand[j]);S.me.hand.splice(j,1);}
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
  while(S.me.hand.length<7)draw('me');
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
  if(cr[0])S.me.hand[S.me.hand.length-1]=cr[0]; render();});
await p.waitForTimeout(300);
const board=await (await p.$('#myBoard')).boundingBox();
const el=await p.$('.hcw:last-child'); const bx=await el.boundingBox();
const sx=bx.x+bx.width/2, sy=bx.y+bx.height/2;

async function tryDrag(label,holdMs){
  await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;
    S.me.board=Array(SLOTS).fill(null);
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    while(S.me.hand.length<7)draw('me');
    const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
    S.me.hand[S.me.hand.length-1]=cr[0];      /* 매번 낼 수 있는 크리처를 맨 오른쪽에 */
    render();});
  await p.waitForTimeout(250);
  const b0=await (await p.$('.hcw:last-child')).boundingBox();
  const x0=b0.x+b0.width/2, y0=b0.y+b0.height/2;
  await touch('touchStart',x0,y0);
  if(holdMs)await p.waitForTimeout(holdMs);
  const zoomOpen=await p.$eval('#zoom',e=>e.classList.contains('on'));
  for(let k=1;k<=6;k++)await touch('touchMove',x0,y0-(k*30));
  await p.waitForTimeout(60);
  const dragging=await p.evaluate(()=>!!DR);
  await touch('touchMove',board.x+board.width/2,board.y+board.height/2);
  await p.waitForTimeout(60);
  await touch('touchEnd',0,0);
  await p.waitForTimeout(450);
  const placed=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  const hand=await p.evaluate(()=>S.me.hand.length);
  console.log(`${placed>0?'✅':'❌'} ${label.padEnd(26)} 확대열림 ${zoomOpen} · DR ${dragging} · 소환 ${placed} · 손패 ${hand}`);
}
await tryDrag('바로 끌기 (홀드 0ms)',0);
await tryDrag('0.2초 뒤 끌기',200);
await tryDrag('0.6초 홀드 뒤 끌기 (확대 뜬 상태)',600);
// 4) 확대했다 떼면 닫히고, 곧바로 다음 카드를 끌 수 있어야 한다
await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;
  S.me.board=Array(SLOTS).fill(null);
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
  while(S.me.hand.length<7)draw('me');
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
  S.me.hand[S.me.hand.length-1]=cr[0]; render();});
await p.waitForTimeout(250);
{
  const b0=await (await p.$('.hcw:last-child')).boundingBox();
  const x0=b0.x+b0.width/2, y0=b0.y+b0.height/2;
  await touch('touchStart',x0,y0); await p.waitForTimeout(600);
  const open1=await p.$eval('#zoom',e=>e.classList.contains('on'));
  await touch('touchEnd',0,0); await p.waitForTimeout(250);
  const open2=await p.$eval('#zoom',e=>e.classList.contains('on'));
  console.log(`${open1&&!open2?'✅':'❌'} 확대 후 떼면 닫힘          누르는 중 ${open1} · 뗀 뒤 ${open2}`);
  // 곧바로 끌기
  const b1=await (await p.$('.hcw:last-child')).boundingBox();
  const x1=b1.x+b1.width/2, y1=b1.y+b1.height/2;
  await touch('touchStart',x1,y1);
  for(let k=1;k<=6;k++)await touch('touchMove',x1,y1-(k*30));
  await touch('touchMove',board.x+board.width/2,board.y+board.height/2);
  await p.waitForTimeout(60); await touch('touchEnd',0,0); await p.waitForTimeout(450);
  const placed=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  console.log(`${placed>0?'✅':'❌'} 확대 직후 바로 끌기         소환 ${placed}`);
}
console.log('ERRORS:',errs.slice(0,3));
await b.close();})();
