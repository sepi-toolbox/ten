/* 드래그 삽입 위치 미리보기 — 손끝 x 가 정하는 자리에 정말로 들어가는가
 *   node tools/test_insert.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(250);
await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(250);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(300);
async function setup(nBoard){
  await p.evaluate(k=>{
    S.me.board=[]; S.me.lands=[];
    for(let i=0;i<8;i++){S.me.landPlayed=false;playLand('me','불지옥');}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&!POOL[n].over);
    /* 손에 쥘 카드를 먼저 정하고, 판은 그것과 다른 이름으로 채운다(indexOf 로 위치 확인) */
    const cheap=cr.filter(n=>POOL[n].c<=2)[0];
    const rest=cr.filter(n=>n!==cheap);
    for(let i=0;i<k;i++)placeCreature('me',rest[i%rest.length]);
    while(S.me.hand.length<7)draw('me');
    S.me.hand[S.me.hand.length-1]=cheap;
    window.__pick=cheap;
    S.sel=null;S.mode=null;render();},nBoard);
  await p.waitForTimeout(300);
}
async function dropAt(frac,label){
  const el=await p.$('#hand .hcw:last-child'); const bx=await el.boundingBox();
  const bd=await (await p.$('#myBoard')).boundingBox();
  const tx=bd.x+bd.width*frac, ty=bd.y+bd.height/2;
  const before=await p.evaluate(()=>S.me.board.map(u=>u.name));
  const name=await p.evaluate(()=>window.__pick);
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2); await p.mouse.down();
  await p.mouse.move(bx.x+bx.width/2,bx.y-50,{steps:4});
  await p.mouse.move(tx,ty,{steps:8}); await p.waitForTimeout(120);
  const bar=await p.evaluate(()=>{const e=document.getElementById('dropbar');
    return e&&e.classList.contains('on')?Math.round(parseFloat(e.style.left)):null;});
  const at=await p.evaluate(()=>DR?DR.at:null);
  await p.mouse.up(); await p.waitForTimeout(400);
  const after=await p.evaluate(()=>S.me.board.map(u=>u.name));
  const pos=after.indexOf(name);
  console.log(`${pos===at?'✅':'❌'} ${label.padEnd(22)} 미리보기 at=${at}(x=${bar}) → 실제 ${pos}번째 · ${after.join(' ')}`);
}
await setup(0); await dropAt(0.5,'빈 판 — 가운데');
await setup(3); await dropAt(0.05,'3장 — 맨 왼쪽');
await setup(3); await dropAt(0.5,'3장 — 가운데 사이');
await setup(3); await dropAt(0.95,'3장 — 맨 오른쪽');
await setup(6); await dropAt(0.35,'6장 — 왼쪽 사이');
console.log('ERRORS:',errs.slice(0,3));
await p.screenshot({path:'/tmp/ins.png'});
await b.close();})();
