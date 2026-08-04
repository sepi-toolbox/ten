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

/* ── 2026-08 대상 지정 개편 ─────────────────────────────────
   ① 소환 카드(메두사)가 실제로 소환하는가
   ② 상대 카드 **위에 떨궈도** 바로 발동하지 않는다(항상 대상 선택을 거친다)
   ③ 본체를 겨눌 수 있는 주문은 상대 정보줄을 눌러 쏠 수 있다 */
let TB=0; const tok=(k,v,d)=>{ if(!v)TB++; console.log((v?'✅':'❌')+' '+String(k).padEnd(24)+' '+d); };
await p.evaluate(()=>{SPEED=30;setDeck('fire');}); await p.waitForTimeout(300);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);

/* ⚠ 메두사는 "소환 시 뱀 2개체를 양옆에" 인데, 예전 정규식이 스킬라의 "1/4 수호 여왕의 가신"
   앞머리를 요구해서 **통째로 안 걸렸다** — 카드가 조용히 아무것도 안 했다. */
const SM=await p.evaluate(()=>{
  const put=n=>{ S.gen=(S.gen||0)+1; S.me.board=[];
    placeCreature('me',n,0); onSummon('me',n,0);
    return S.me.board.map(u=>u.name).join('|'); };
  return {메두사:put('메두사'), 스킬라:put('스킬라')};
});
tok('메두사 = 뱀 양옆', SM.메두사==='뱀|메두사|뱀', SM.메두사);
tok('스킬라도 그대로', SM.스킬라==='여왕의 가신|스킬라|여왕의 가신', SM.스킬라);

await p.evaluate(()=>{
  S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; S.ai.hp=60; S.over=false; S.busy=false;
  S.active='me'; S.sel=null; S.mode=null;
  placeCreature('ai','헬하운드',0);
  S.me.hand=['화염구'];
  S.me.lands=[]; for(let i=0;i<10;i++){S.me.landPlayed=false;playLand('me','불지옥');}
  S.me.lands.forEach(l=>{l.used=false;l.entering=false;}); render();
});
await p.waitForTimeout(300);
/* ⚠ 앞선 검사들이 남긴 드래그 상태를 푼다. dg/DR 이 남아 있으면 새 pointerdown 이 씹혀서
   '드래그가 아예 안 되는' 것처럼 보인다 — 카드 탓으로 오해하기 쉬운 실패다. */
await p.mouse.up().catch(()=>{});
/* ⚠ 열려 있는 창(.mull — 멀리건·원정)이 손패를 통째로 덮는다. 남아 있으면 pointerdown 이
   카드가 아니라 창에 꽂혀서 **드래그가 아예 안 되는** 것처럼 보인다. */
await p.evaluate(()=>{ document.querySelectorAll('.mull.on').forEach(e=>e.classList.remove('on'));
  try{DR=null;dg=null;lpFired=false;}catch(e){} });
await p.waitForTimeout(150);
{
  const hc=await p.$('#hand .hcw'), bx=await hc.boundingBox();
  const fs=await p.$('#foeBoard .slot'), fb=await fs.boundingBox();
  const hp0=await p.evaluate(()=>S.ai.board[0].insts[0].hp);
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2); await p.mouse.down();
  await p.mouse.move(bx.x+bx.width/2,bx.y-60,{steps:4});
  await p.mouse.move(fb.x+fb.width/2,fb.y+fb.height/2,{steps:6});
  await p.mouse.up(); await p.waitForTimeout(350);
  const st=await p.evaluate(h=>({타게팅:document.body.classList.contains('tgtmode'),
    손패:S.me.hand.length, 적HP:h+'→'+S.ai.board[0].insts[0].hp,
    본체켜짐:document.getElementById('foeBar').classList.contains('pick')}),hp0);
  /* 떨군 자리로 대상을 정하던 지름길은 없앴다 — 겹쳐 떨궈도 **대상 선택이 떠야** 한다 */
  tok('적 위에 떨궈도 안 나감', st.타게팅&&st.손패===1&&/^(\d+)→\1$/.test(st.적HP),
      `타게팅 ${st.타게팅} · 손패 ${st.손패} · 적 HP ${st.적HP}`);
  tok('본체도 대상으로 켜진다', st.본체켜짐===true, `#foeBar.pick = ${st.본체켜짐}`);
  /* 상대 정보줄(이름·HP·체력바) 아무 데나 눌러 본체에 쏜다 */
  const bar=await p.$('#foeBar'), br=await bar.boundingBox();
  const ai0=await p.evaluate(()=>S.ai.hp);
  await p.mouse.move(br.x+br.width/2,br.y+br.height/2);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(900);
  const af=await p.evaluate(a=>({HP:a+'→'+S.ai.hp, 손패:S.me.hand.length,
    타게팅:document.body.classList.contains('tgtmode'),
    표시남음:document.getElementById('foeBar').classList.contains('pick')}),ai0);
  tok('본체를 눌러 쏜다', af.HP==='60→55'&&af.손패===0, `${af.HP} · 손패 ${af.손패}`);
  /* 켠 표시는 슬롯과 달리 다시 그려지지 않는다 — 손으로 지워야 남지 않는다 */
  tok('본체 표시가 남지 않는다', af.타게팅===false&&af.표시남음===false,
      `타게팅 ${af.타게팅} · 표시 ${af.표시남음}`);
}
/* 본체를 못 때리는 주문은 정보줄이 켜지지 않는다 */
const NF=await p.evaluate(()=>({벽:canFace('불꽃의 벽'), 구:canFace('화염구'), 애로우:canFace('파이어 애로우')}));
tok('canFace 판정', NF.구&&NF.애로우&&!NF.벽, `화염구 ${NF.구} · 애로우 ${NF.애로우} · 불꽃의 벽 ${NF.벽}`);
/* ── ⚠⚠ 모든 스펠이 제 모드로 흘러가는가 (일반 검사) ──────────────
   modeOf 는 맨 끝이 `return 'target'` 이다. 새 mode 를 만들고 INSTANT 나 분기에 등록하는 걸
   빠뜨리면 **대상이 필요 없는 카드에 대상 선택 창이 뜬다** — 산불·수정구의 힘(ritual)이
   실제로 그랬다. 카드 하나가 아니라 **모드 전체**를 훑어서 그 실수를 막는다. */
const MODES=await p.evaluate(()=>{
  const bad=[], seen={};
  Object.entries(POOL).forEach(([n,c])=>{
    if(c.k!=='sp')return;
    const m=modeOf(n);
    (seen[c.mode]=seen[c.mode]||[]).push(m);
    /* 상대를 겨누는 모드가 아닌데 target 으로 흘러갔으면 등록을 빠뜨린 것이다.
       ⚠ '상대를 겨눈다' 는 NEEDS_FOE 만이 아니다 — 상대에게 심는 부여(작열 감옥)도
         정당한 target 이다. 엔진이 쓰는 판정(isFoeGrant)을 그대로 쓴다. */
    if(m==='target'&&!NEEDS_FOE.includes(c.mode)&&!isFoeGrant(n))bad.push(`${n}(${c.mode})`);
  });
  return {bad, ritual:[modeOf('산불'),modeOf('수정구의 힘')].join(','),
          모드수:Object.keys(seen).length};
});
tok('모드가 전부 등록돼 있다', MODES.bad.length===0,
    MODES.bad.join(' ')||`스펠 모드 ${MODES.모드수}종 전부 제 길로`);
tok('지형 생성은 즉시 발동', MODES.ritual==='instant,instant', `산불·수정구의 힘 → ${MODES.ritual}`);

if(TB)console.log(`❌ 대상 지정 ${TB}건 실패`); else console.log('✅ 대상 지정 전부 통과');
await b.close();})();
