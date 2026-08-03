const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=20;setDeck('fire');});await p.waitForTimeout(300);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
async function stock(){ await p.evaluate(()=>{
  while(S.me.lands.length<8){S.me.landPlayed=false;const j=S.me.hand.findIndex(isLand);
    if(j<0)break;playLand('me',S.me.hand[j]);S.me.hand.splice(j,1);}
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
  while(S.me.hand.length<7)draw('me');
  /* 대상 스펠 한 장을 손에 보장한다 */
  const tsp=Object.keys(POOL).find(n=>POOL[n].k==='sp'&&POOL[n].el==='fire'&&POOL[n].c<=3
    &&!INSTANT.includes(POOL[n].mode)&&POOL[n].mode!=='summon'&&!NEEDS_MINE.includes(POOL[n].mode));
  /* 겹친 손패에서는 가운데를 집으면 오른쪽 이웃이 잡힌다 → 맨 오른쪽에 둔다 */
  if(tsp)S.me.hand[S.me.hand.length-1]=tsp;
  render();}); await p.waitForTimeout(150); }
async function dragOut(i,tx,ty){
  const el=await p.$(`#hand .hcw[data-h="${i}"]`); const bx=await el.boundingBox();
  const sx=bx.x+bx.width/2, sy=bx.y+bx.height/2;
  await p.mouse.move(sx,sy); await p.mouse.down();
  await p.mouse.move(sx,sy-30,{steps:4}); await p.mouse.move(tx,ty,{steps:8});
  await p.mouse.up(); await p.waitForTimeout(300);
}
await stock();
await p.evaluate(()=>{ const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].h>=4);
  placeCreature('ai',cr[0],2); placeCreature('ai',cr[1],6); render(); });
const board=await (await p.$('#myBoard')).boundingBox();
const foeb =await (await p.$('#foeBoard')).boundingBox();

// 1) 대상 스펠을 빈 곳에 떨구면 → 타게팅 진입 (즉시 발동 X)
let i=await p.evaluate(()=>S.me.hand.length-1);
const nm=await p.evaluate(j=>S.me.hand[j],i);
const h0=await p.evaluate(()=>S.me.hand.length);
await dragOut(i, board.x+board.width/2, board.y-60);
console.log('1) 대상 스펠',nm,'| 타게팅중',await p.evaluate(()=>!!TGT),
  '· 카드 아직 손에',await p.evaluate(()=>S.me.hand.length)===h0,
  '· 화살표',await p.$$eval('#tgtsvg .ln',e=>e.length),'· 후보 하이라이트',await p.$$eval('#foeBoard .slot.pick',e=>e.length));

// 2) 화살표가 손끝을 따라오고, 무효 지점에선 붉게
await p.mouse.move(board.x+200,board.y+40,{steps:4}); await p.waitForTimeout(120);
console.log('   빈 곳 조준 → bad',await p.$eval('#tgtsvg',e=>e.classList.contains('bad')));
const t=await p.$('#foeBoard .slot.pick'); const tb=await t.boundingBox();
await p.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2,{steps:4}); await p.waitForTimeout(120);
console.log('   유효 대상 조준 → bad',await p.$eval('#tgtsvg',e=>e.classList.contains('bad')));

// 3) 유효 대상 탭 → 발동
const bhp=await p.evaluate(()=>{const u=S.ai.board.find(x=>x);return u?u.insts[0].hp:null;});
await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(700);
console.log('3) 대상 탭 →','타게팅',await p.evaluate(()=>!!TGT),
  '· 손패',h0,'→',await p.evaluate(()=>S.me.hand.length),
  '· 상대 보드',await p.evaluate(()=>S.ai.board.map(u=>u?u.name+'/'+u.insts[0].hp:'·').join(' ')));

// 4) 빈 곳 탭 → 취소되고 카드는 손에 남는다
await stock();
i=await p.evaluate(()=>S.me.hand.length-1);
if(i>=0){
  const h1=await p.evaluate(()=>S.me.hand.length);
  await dragOut(i, board.x+board.width/2, board.y-60);
  const on=await p.evaluate(()=>!!TGT);
  await p.mouse.click(board.x+board.width-8, board.y-90); await p.waitForTimeout(300);
  console.log('4) 빈 곳 탭 | 진입',on,'→ 타게팅',await p.evaluate(()=>!!TGT),
    '· 손패',h1,'→',await p.evaluate(()=>S.me.hand.length),'· sel',await p.evaluate(()=>S.sel));
} else console.log('4) 대상 스펠 없음');

// 5) 대상 위에 바로 떨구면 타게팅 없이 즉시 발동
await stock();
await p.evaluate(()=>{ const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].h>=4);
  if(!S.ai.board.some(x=>x))placeCreature('ai',cr[0],2); render(); });
i=await p.evaluate(()=>S.me.hand.length-1);
if(i>=0){ const s=await p.$('#foeBoard .slot.occ'); const sb=await s.boundingBox();
  const h2=await p.evaluate(()=>S.me.hand.length);
  await dragOut(i, sb.x+sb.width/2, sb.y+sb.height/2);
  console.log('5) 대상 위 직접 드롭 | 타게팅',await p.evaluate(()=>!!TGT),'· 손패',h2,'→',await p.evaluate(()=>S.me.hand.length));
} else console.log('5) 대상 스펠 없음');

// 6) 크리처는 여전히 타게팅 없이 왼쪽부터
await stock();
/* 무작위 드로우로 낼 수 있는 크리처가 하나도 없을 수 있다 — 맨 오른쪽에 한 장 심어 둔다.
   (겹친 손패에서 온전히 드러나 집을 수 있는 자리는 맨 오른쪽뿐이다) */
await p.evaluate(()=>{const c=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2)
  .sort((a,b)=>POOL[a].c-POOL[b].c)[0];
  if(c)S.me.hand[S.me.hand.length-1]=c; render();});
await p.waitForTimeout(150);
i=await p.evaluate(()=>S.me.hand.findIndex(n=>POOL[n]&&POOL[n].k==='cr'&&canPay('me',n)));
if(i<0)i=await p.evaluate(()=>S.me.hand.length-1);
await dragOut(i, board.x+board.width-20, board.y+30);
console.log('6) 크리처 | 타게팅',await p.evaluate(()=>!!TGT),'· 보드',await p.evaluate(()=>S.me.board.map(u=>u?u.name:'·').join(' ')));

// 7) cancelTargeting() 으로 해제 (화면의 취소 버튼은 없앴다 — 빈 곳 탭이 취소다)
await p.evaluate(()=>{   /* 앞 검사에서 적이 다 죽었을 수 있다 — 대상이 없으면 타게팅에 들어가지 않는다 */
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].h>=4&&!POOL[n].over);
  S.ai.board=[]; placeCreature('ai',cr[0]); placeCreature('ai',cr[1]); render();});
await stock();
i=await p.evaluate(()=>S.me.hand.length-1);
if(i>=0){ await dragOut(i, board.x+board.width/2, board.y-60);
  const on=await p.evaluate(()=>!!TGT);
  await p.evaluate(()=>cancelTargeting()); await p.waitForTimeout(250);
  console.log('7) 타게팅 해제 | 진입',on,'→ 타게팅',await p.evaluate(()=>!!TGT),'· 잔여 SVG',await p.$$eval('#tgtsvg',e=>e.length));
} else console.log('7) 대상 스펠 없음');
console.log('ERRORS:',errs.slice(0,4));
await b.close();})();
