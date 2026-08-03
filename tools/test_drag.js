const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=8;setDeck('fire');});await p.waitForTimeout(300);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
// 마나를 넉넉히 깔고 손패를 채운다
async function stock(){ await p.evaluate(()=>{
  while(S.me.lands.length<8){ S.me.landPlayed=false; const j=S.me.hand.findIndex(isLand);
    if(j<0)break; playLand('me',S.me.hand[j]); S.me.hand.splice(j,1); }
  S.me.lands.forEach(l=>{l.used=false;l.sick=false;});
  while(S.me.hand.length<7)draw('me'); render(); }); await p.waitForTimeout(150); }
async function drag(i,tx,ty,label){
  const el=await p.$(`#hand .hcw[data-h="${i}"]`); if(!el){console.log(label,'| 카드 없음');return;}
  const bx=await el.boundingBox();
  const sx=bx.x+bx.width/2, sy=bx.y+bx.height/2;
  await p.mouse.move(sx,sy); await p.mouse.down();
  await p.mouse.move(sx,sy-30,{steps:4});
  await p.mouse.move(tx,ty,{steps:8});
  const g=await p.$$eval('.dgh',e=>e.length);
  const armed=await p.evaluate(()=>document.body.classList.contains('armed'));
  await p.mouse.up(); await p.waitForTimeout(450);
  console.log(label,`| 드래그중 고스트 ${g} · 발동준비 ${armed} · 놓은 뒤 고스트 ${await p.$$eval('.dgh',e=>e.length)}`);
}
const idxOf=(f)=>p.evaluate(f);
await stock();
const board=await (await p.$('#myBoard')).boundingBox();
const foeb =await (await p.$('#foeBoard')).boundingBox();
const hb   =await (await p.$('#hand')).boundingBox();

console.log('── 1. 지형: 크리처 보드 위에 대충 떨궈도 배치');
let i=await idxOf(()=>S.me.hand.findIndex(isLand));
await p.evaluate(()=>{S.me.landPlayed=false;});
const l0=await idxOf(()=>S.me.lands.length);
await drag(i, board.x+board.width*0.6, board.y+20, '  지형');
console.log('   지형',l0,'→',await idxOf(()=>S.me.lands.length));

console.log('── 2. 크리처: 오른쪽 끝에 놓아도 왼쪽부터 채움');
await stock();
i=await idxOf(()=>S.me.hand.findIndex(n=>POOL[n]&&POOL[n].k==='cr'&&canPay('me',n)));
await drag(i, board.x+board.width-25, board.y+30, `  ${await idxOf(j=>S.me.hand[j],i)}`);
console.log('   보드:',await idxOf(()=>S.me.board.map(u=>u?u.name:'·').join(' ')));
await stock();
i=await idxOf(()=>S.me.hand.findIndex(n=>POOL[n]&&POOL[n].k==='cr'&&canPay('me',n)));
await drag(i, hb.x+hb.width-40, board.y-40, `  두 번째 크리처(보드 밖 여백)`);
console.log('   보드:',await idxOf(()=>S.me.board.map(u=>u?u.name:'·').join(' ')));

console.log('── 3. 손패 안에 다시 놓으면 취소');
await stock();
i=await idxOf(()=>S.me.hand.findIndex(n=>POOL[n]&&canPay('me',n)));
const h0=await idxOf(()=>S.me.hand.length);
await drag(i, hb.x+hb.width/2, hb.y+hb.height/2, '  취소');
console.log('   손패',h0,'→',await idxOf(()=>S.me.hand.length),'· sel',await idxOf(()=>S.sel));

console.log('── 4. 가로 스와이프는 스크롤(발동 안 됨)');
const h1=await idxOf(()=>S.me.hand.length);
const e4=await p.$(`#hand .hcw[data-h="${i}"]`); const b4=await e4.boundingBox();
await p.mouse.move(b4.x+b4.width/2,b4.y+b4.height/2); await p.mouse.down();
await p.mouse.move(b4.x+b4.width/2-70,b4.y+b4.height/2+3,{steps:6});
const g4=await p.$$eval('.dgh',e=>e.length);
await p.mouse.move(board.x+100,board.y+30,{steps:6}); await p.mouse.up(); await p.waitForTimeout(300);
console.log(`   고스트 ${g4}(0이어야) · 손패 ${h1} → ${await idxOf(()=>S.me.hand.length)}`);

console.log('── 5. 대상 스펠: 빈 곳에 떨구면 타게팅 진입 (tg.js 가 본검사)');
await p.evaluate(()=>{const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire');
  placeCreature('ai',cr[0],4);placeCreature('ai',cr[1],7);render();});
await stock();
i=await idxOf(()=>S.me.hand.findIndex(n=>POOL[n]&&POOL[n].k==='sp'&&canPay('me',n)&&!INSTANT.includes(POOL[n].mode)&&POOL[n].mode!=='summon'&&!NEEDS_MINE.includes(POOL[n].mode)));
if(i>=0){ const nm=await idxOf(j=>S.me.hand[j],i);
  await drag(i, foeb.x+foeb.width/2, foeb.y-30, `  ${nm} (보드 위 여백)`);
  console.log('   타게팅 진입:',await idxOf(()=>!!TGT));
  await p.evaluate(()=>cancelTargeting()); await p.waitForTimeout(200);
} else console.log('   대상 스펠 없음(건너뜀)');

console.log('── 6. 탭은 아무것도 하지 않는다(끌어야만 발동) · 롱프레스 확대만');
await stock();
i=await idxOf(()=>S.me.hand.findIndex(n=>POOL[n]&&canPay('me',n)));
const b0=await idxOf(()=>S.me.board.filter(x=>x).length);
await p.click(`#hand .hcw[data-h="${i}"]`); await p.waitForTimeout(250);
console.log('   탭 → sel',await idxOf(()=>S.sel),'(null 이어야) · 보드',b0,'→',await idxOf(()=>S.me.board.filter(x=>x).length));
console.log('   취소 버튼 제거됨:',!(await p.$('#cancel')));
const e6=await p.$(`#hand .hcw[data-h="${i}"]`); const b6=await e6.boundingBox();
await p.mouse.move(b6.x+b6.width/2,b6.y+b6.height/2); await p.mouse.down(); await p.waitForTimeout(650);
console.log('   롱프레스 확대:',await p.$eval('#zoom',e=>e.classList.contains('on')));
await p.mouse.up(); await p.evaluate(()=>{hideZoom();lpFired=false;});
console.log('ERRORS:',errs.slice(0,3));
await b.close();})();
