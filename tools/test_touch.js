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
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
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
const el=await p.$('#hand .hcw:last-child'); const bx=await el.boundingBox();
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
  const b0=await (await p.$('#hand .hcw:last-child')).boundingBox();
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
// 4) 확대는 팝업이다 — 떼도 남아 있고, 화면 아무 곳이나 탭해야 닫힌다.
//    닫은 뒤에는 곧바로 다음 카드를 끌 수 있어야 한다.
await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;
  S.me.board=Array(SLOTS).fill(null);
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
  while(S.me.hand.length<7)draw('me');
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
  S.me.hand[S.me.hand.length-1]=cr[0]; render();});
await p.waitForTimeout(250);
{
  const b0=await (await p.$('#hand .hcw:last-child')).boundingBox();
  const x0=b0.x+b0.width/2, y0=b0.y+b0.height/2;
  await touch('touchStart',x0,y0); await p.waitForTimeout(600);
  const open1=await p.$eval('#zoom',e=>e.classList.contains('on'));
  await touch('touchEnd',0,0); await p.waitForTimeout(250);
  const open2=await p.$eval('#zoom',e=>e.classList.contains('on'));
  /* 빈 곳을 탭해 닫는다 — 손패 위를 짚으면 카드가 선택되어 다음 검사가 흔들린다 */
  await touch('touchStart',Math.round(390*0.5),40); await touch('touchEnd',0,0);
  await p.waitForTimeout(250);
  const open3=await p.$eval('#zoom',e=>e.classList.contains('on'));
  console.log(`${open1&&open2&&!open3?'✅':'❌'} 확대는 팝업으로 남는다      뗀 뒤 ${open2} · 빈 곳 탭 뒤 ${open3}`);
  await p.evaluate(()=>{lpFired=false;S.sel=null;S.mode=null;render();}); await p.waitForTimeout(200);
  // 닫은 뒤 곧바로 끌기
  const b1=await (await p.$('#hand .hcw:last-child')).boundingBox();
  const x1=b1.x+b1.width/2, y1=b1.y+b1.height/2;
  await touch('touchStart',x1,y1);
  for(let k=1;k<=6;k++)await touch('touchMove',x1,y1-(k*30));
  await touch('touchMove',board.x+board.width/2,board.y+board.height/2);
  await p.waitForTimeout(60); await touch('touchEnd',0,0); await p.waitForTimeout(450);
  const placed=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  console.log(`${placed>0?'✅':'❌'} 닫은 직후 바로 끌기         소환 ${placed}`);
}
// 5) 드래그 도중 손패 DOM 이 살아 있어야 한다 (터치 캡처가 끊기면 드래그가 죽는다)
await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;
  S.me.board=Array(SLOTS).fill(null);
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
  while(S.me.hand.length<7)draw('me');
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
  S.me.hand[S.me.hand.length-1]=cr[0]; render();
  window.__cancels=0;
  document.addEventListener('pointercancel',()=>{window.__cancels++;},true);
  const h=document.getElementById('hand');
  window.__node=h.lastElementChild;});
await p.waitForTimeout(250);
{
  const b0=await (await p.$('#hand .hcw:last-child')).boundingBox();
  const x0=b0.x+b0.width/2, y0=b0.y+b0.height/2;
  await touch('touchStart',x0,y0);
  for(let k=1;k<=6;k++){await touch('touchMove',x0,y0-(k*30)); await p.waitForTimeout(20);}
  const alive=await p.evaluate(()=>window.__node&&window.__node.isConnected);
  const cancels=await p.evaluate(()=>window.__cancels);
  await touch('touchMove',board.x+board.width/2,board.y+board.height/2);
  await p.waitForTimeout(60); await touch('touchEnd',0,0); await p.waitForTimeout(450);
  const placed=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  console.log(`${alive&&!cancels&&placed>0?'✅':'❌'} 끄는 동안 손패 노드 생존  연결됨 ${alive} · pointercancel ${cancels} · 소환 ${placed}`);
}
// 6) 낼 수 없는 카드도 끌리고, 이유를 알려 준다
await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;
  S.me.board=Array(SLOTS).fill(null);
  S.me.lands.forEach(l=>{l.used=true;});     /* 마나를 전부 소진시킨다 */
  S.me.landPlayed=true;                      /* 지형도 이미 놓은 것으로 */
  /* ⚠ 맨 오른쪽 카드가 무작위라 지형이 걸리면 '못 내는 카드'가 아니게 된다.
     마나가 드는 크리처를 직접 심어 검사를 고정한다. */
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].c>=2)
    .sort((a,b)=>POOL[b].c-POOL[a].c)[0];
  if(cr)S.me.hand[S.me.hand.length-1]=cr;
  render();});
await p.waitForTimeout(250);
{
  const b0=await (await p.$('#hand .hcw:last-child')).boundingBox();
  const x0=b0.x+b0.width/2, y0=b0.y+b0.height/2;
  await touch('touchStart',x0,y0);
  for(let k=1;k<=6;k++){await touch('touchMove',x0,y0-(k*28)); await p.waitForTimeout(15);}
  const dr=await p.evaluate(()=>!!DR);
  const tip=await p.evaluate(()=>{const t=document.querySelector('.dztip');return t?t.textContent:'없음';});
  await touch('touchMove',board.x+board.width/2,board.y+board.height/2);
  await p.waitForTimeout(50); await touch('touchEnd',0,0); await p.waitForTimeout(400);
  const toast=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:'없음';});
  const placed=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  console.log(`${dr&&placed===0&&toast!=='없음'?'✅':'❌'} 못 내는 카드도 끌림       DR ${dr} · 안내 "${tip}" · 놓은 뒤 "${toast}" · 소환 ${placed}`);
}
// 7) 가로로 스크롤될 여지가 없어야 한다
//    (.main 이 가로로 스크롤 가능하면 iOS 가 그 팬을 가져가 드래그를 취소한다)
console.log(await p.evaluate(()=>{
  const m=document.querySelector('.main'), h=document.getElementById('hand');
  const cs=getComputedStyle(m);
  const bad=m.scrollWidth>m.clientWidth+1;
  return `${bad?'❌':'✅'} 가로 스크롤 없음         .main overflow-x=${cs.overflowX}`
    +` scrollWidth ${m.scrollWidth}/${m.clientWidth}`
    +` · touch-action 카드=${getComputedStyle(h.firstElementChild).touchAction}`;}));
// 8) 상대 손패가 뒷면으로 보이고, 만질 수 없어야 한다
console.log(await p.evaluate(()=>{
  while(S.ai.hand.length<6)draw('ai'); render();
  const f=document.getElementById('foeHand'), cs=[...f.children];
  const pe=cs.length?getComputedStyle(cs[0]).pointerEvents:'-';
  const faceUp=f.textContent.trim().length>0;   /* 앞면이면 카드 이름 글자가 있다 */
  const okAll=cs.length===S.ai.hand.length&&pe==='none'&&!faceUp;
  return `${okAll?'✅':'❌'} 상대 손패 뒷면          ${cs.length}장/${S.ai.hand.length}장`
    +` · pointer-events ${pe} · 글자 노출 ${faceUp}`;}));
console.log('ERRORS:',errs.slice(0,3));
await b.close();})();
