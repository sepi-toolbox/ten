/* 연출 — 부활 오오라 · 환류 손패 생성 · 주문 발사체 · 파괴 · 수확 표식 · 제물
 *   node tools/test_castfx.js
 *
 * 왜 이 파일이 있나 — 연출은 **틀려도 검사가 안 죽는다.** 오오라가 안 뜨고 발사체가
 * 한쪽에서만 날아가도 게임은 멀쩡히 돌아가서, 눈으로 볼 때까지 아무도 모른다.
 * 그래서 '무엇이 화면에 붙었는가' 를 직접 센다.
 */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(900);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{SPEED=1;setDeck('dark');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(350);
  const EL_WATER=await p.evaluate(()=>EL.water.c);
  const reset=()=>p.evaluate(()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];
    S.me.hand=[];S.ai.hand=[];S.me.shown={};S.ai.shown={};S.me.echoNew=null;S.ai.echoNew=null;
    S.me.noecho={};S.ai.noecho={};S.busy=false;render();});

  /* ── 1) 단말마 부활 — 보라 오오라 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('me','구울',0); placeCreature('me','스컬 기마병',1);
    S.me.board[1].insts.forEach(i=>{i.hp=0;}); cleanup('me'); render(); });
  await p.waitForTimeout(120);
  const rev=await p.evaluate(()=>[...document.querySelectorAll('.slot.revived')]
    .map(e=>e.parentElement.id+'/'+e.dataset.idx));
  /* ⚠ **죽은 그 자리**에 붙어야 한다. 슬롯 번호가 아니라 개체에 단 표시라 자리가 밀려도 따라간다. */
  ok('부활 = 보라 오오라', rev.length===1&&rev[0]==='myBoard/1', rev.join(', ')||'(안 붙음)');
  /* 그냥 소환한 몸에는 안 붙는다 — 소환(spawned)과 부활은 색으로 갈린다 */
  await reset();
  await p.evaluate(()=>{ placeCreature('me','구울',0); render(); });
  await p.waitForTimeout(80);
  ok('그냥 소환엔 안 붙음', (await p.evaluate(()=>document.querySelectorAll('.slot.revived').length))===0, '');
  /* 시간이 지나면 걷힌다 */
  await p.waitForTimeout(1100);
  ok('오오라는 걷힌다', (await p.evaluate(()=>document.querySelectorAll('.slot.revived').length))===0, '');

  /* ── 2) 환류 — 손패에 일렁이며 생기고, 상대 것도 앞면 ── */
  await reset();
  await p.evaluate(()=>{ S.ai.hand=['구울','좀비']; echoToHand('ai','전기 해파리');
    echoToHand('me','전기 해파리'); render(); });
  await p.waitForTimeout(120);
  const eh=await p.evaluate(()=>({
    앞면:[...document.querySelectorAll('#foeHand .hcw.open .tname')].map(e=>e.textContent),
    뒷면:document.querySelectorAll('#foeHand .hcw.back').length,
    일렁:document.querySelectorAll('.hcw.echoin').length}));
  ok('상대 환류는 앞면으로', eh.앞면.join()==='전기 해파리'&&eh.뒷면===2,
     `앞면 [${eh.앞면}] · 뒷면 ${eh.뒷면}장`);
  ok('양쪽 다 일렁인다', eh.일렁===2, `${eh.일렁}장`);
  /* ⚠ 낸 뒤에는 스스로 지워져야 한다 — 지우는 자리를 따로 두면 splice 하는 곳 하나를 빠뜨린다 */
  await p.evaluate(()=>{ S.ai.hand=S.ai.hand.filter(n=>n!=='전기 해파리'); render(); });
  await p.waitForTimeout(80);
  const gone=await p.evaluate(()=>({열림:document.querySelectorAll('#foeHand .hcw.open').length,
                                    표시:JSON.stringify(S.ai.shown)}));
  ok('내고 나면 표시가 지워짐', gone.열림===0&&/"전기 해파리":0/.test(gone.표시),
     `앞면 ${gone.열림}장 · shown ${gone.표시}`);
  /* 뽑아 온 카드는 그냥 뒷면이다 */
  await reset();
  await p.evaluate(()=>{ S.ai.hand=['전기 해파리']; render(); });
  await p.waitForTimeout(80);
  ok('그냥 든 패는 뒷면', (await p.evaluate(()=>document.querySelectorAll('#foeHand .hcw.open').length))===0, '');

  /* ── 3) 주문 발사체 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','구울',0); render(); });
  await p.waitForTimeout(80);
  const fly=p.evaluate(()=>castBolt('me',boltTarget('ai',0),'파이어 애로우'));
  await p.waitForTimeout(140);
  const mid=await p.evaluate(()=>{ const e=document.querySelector('.bolt');
    if(!e)return null; const r=e.getBoundingClientRect();
    return {n:document.querySelectorAll('.bolt').length, z:+getComputedStyle(e).zIndex,
            y:Math.round(r.top)}; });
  ok('발사체가 날아간다', !!mid&&mid.n===1, mid?`${mid.n}개 · y ${mid.y}`:'(안 뜸)');
  /* ⚠ 처리 가리개(.busy z-140) 위여야 보인다 — 아래면 쏘는 내내 딤에 가려 안 보인다 */
  ok('가리개보다 위에 뜬다', !!mid&&mid.z>140, mid?`z-index ${mid.z}`:'');
  await fly; await p.waitForTimeout(450);
  ok('맞고 사라진다', (await p.evaluate(()=>document.querySelectorAll('.bolt').length))===0, '');
  /* 피해 주문만 쏜다 — 요격·바운스는 안 쏜다 */
  const nofly=await p.evaluate(async()=>{ await castBolt('me',boltTarget('ai',0),'사신의 수확');
    return document.querySelectorAll('.bolt').length; });
  ok('피해 주문만 쏜다', nofly===0, `요격 주문 발사체 ${nofly}개`);
  /* 본체를 겨눠도 날아간다 */
  const face=p.evaluate(()=>castBolt('me',boltTarget('ai',FACE),'화염구'));
  await p.waitForTimeout(140);
  ok('본체도 겨눈다', (await p.evaluate(()=>document.querySelectorAll('.bolt').length))===1, '');
  await face;

  /* ── 4) 파괴 연출 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','오아네스',0); placeCreature('ai','구울',1); render(); });
  await p.waitForTimeout(100);
  await p.evaluate(()=>{ S.ai.board[0].insts.forEach(i=>{i.hp=0;}); cleanup('ai'); render(); });
  await p.waitForTimeout(100);
  const dead=await p.evaluate(()=>{ const e=document.querySelector('.deadfx');
    if(!e)return null; const r=e.getBoundingClientRect();
    return {n:document.querySelectorAll('.deadfx').length,
            이름:(e.querySelector('.tname')||{}).textContent||'',
            /* ⚠ 슬롯을 통째로 복제해야 한다 — innerHTML 만 옮기면 카드 속 글자가
               container query 를 잃고 화면만 하게 부푼다(실제로 그랬다). */
            폭:Math.round(r.width), 클릭막힘:getComputedStyle(e).pointerEvents}; });
  ok('파괴 = 부서지는 연출', !!dead&&dead.n===1&&dead.이름==='오아네스',
     dead?`${dead.n}장 · "${dead.이름}"`:'(안 뜸)');
  ok('크기가 안 부푼다', !!dead&&dead.폭>20&&dead.폭<200, dead?`폭 ${dead.폭}px`:'');
  ok('클릭을 안 먹는다', !!dead&&dead.클릭막힘==='none', dead?dead.클릭막힘:'');
  /* 판을 다시 그려도 남은 슬롯은 그대로여야 한다 — 잔상이 진짜 슬롯으로 세어지면 안 된다 */
  ok('판에는 안 섞인다',
     (await p.evaluate(()=>document.querySelectorAll('#foeBoard > .slot').length))===1, '');
  await p.waitForTimeout(800);
  ok('잔상은 걷힌다', (await p.evaluate(()=>document.querySelectorAll('.deadfx').length))===0, '');

  /* ── 5) 사신의 수확 표식 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','오아네스',0); placeCreature('ai','구울',1);
    resolveOnFoe('me','사신의 수확',1); render(); });
  await p.waitForTimeout(100);
  const dm=await p.evaluate(()=>({
    표식:[...document.querySelectorAll('.slot.doomed')].map(e=>e.dataset.idx),
    뱃지:[...document.querySelectorAll('.kb.doom')].map(e=>e.textContent)}));
  ok('수확 표식이 남는다', dm.표식.join()==='1'&&dm.뱃지.join()==='수확',
     `슬롯 [${dm.표식}] · 뱃지 [${dm.뱃지}]`);
  /* 거두고 나면 표식도 사라진다 */
  await p.evaluate(()=>{ S.turn=2; startTurn('me'); render(); });
  await p.waitForTimeout(120);
  ok('거두면 표식도 사라짐',
     (await p.evaluate(()=>document.querySelectorAll('.slot.doomed').length))===0, '');

  /* ── 6) 제물 — 내 체력줄로 피값이 날아간다 ── */
  await reset();
  const sac=p.evaluate(()=>{ const i=S.me.board.length;
    placeCreature('me','데스핸드',i); onSummon('me','데스핸드',i); render(); });
  await p.waitForTimeout(140);
  const sb=await p.evaluate(()=>{ const e=document.querySelector('.bolt');
    if(!e)return null; const r=e.getBoundingClientRect();
    const bar=document.getElementById('myBar').getBoundingClientRect();
    return {n:document.querySelectorAll('.bolt').length, 아래로:r.top>bar.top-260}; });
  ok('제물 = 내 체력줄로', !!sb&&sb.n===1&&sb.아래로, sb?`${sb.n}개 · 내 정보줄 쪽`:'(안 뜸)');
  await sac; await p.waitForTimeout(500);

  /* ── 7) 되돌리기 — 발사체가 아니라 **그 자리에서 속성이 터진다** ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','오아네스',0); render(); });
  await p.waitForTimeout(80);
  const bs=p.evaluate(()=>castBolt('me',boltTarget('ai',0),'정신분열'));
  await p.waitForTimeout(90);
  const burst=await p.evaluate(()=>{ const e=document.querySelector('.burstfx');
    if(!e)return null; const t=document.querySelector('.slot[data-side="ai"][data-idx="0"]')
      .getBoundingClientRect(); const r=e.getBoundingClientRect();
    return {n:document.querySelectorAll('.burstfx').length,
            발사체:document.querySelectorAll('.bolt').length,
            색:getComputedStyle(e).getPropertyValue('--bc').trim(),
            그자리:Math.abs((r.left+r.right)/2-(t.left+t.right)/2)<40}; });
  /* ⚠ 색은 **쏜 주문의 속성**이다 — 정신분열은 물이므로 물색이어야 한다(맞은 카드 색이 아니다) */
  ok('되돌리기 = 그 자리 폭발', !!burst&&burst.n===1&&burst.발사체===0&&burst.그자리,
     burst?`폭발 ${burst.n} · 발사체 ${burst.발사체} · 대상 위 ${burst.그자리}`:'(안 뜸)');
  ok('폭발 색 = 주문 속성', !!burst&&burst.색===EL_WATER, burst?burst.색:'');
  await bs; await p.waitForTimeout(400);

  /* ── 8) 되돌아가는 카드가 손으로 날아가고, 상대 것도 앞면이 된다 ── */
  await reset();
  await p.evaluate(()=>{ placeCreature('ai','오아네스',0); placeCreature('ai','가고일',1);
    S.ai.hand=['올렝']; render(); });
  await p.waitForTimeout(80);
  await p.evaluate(()=>{ toHand('ai',0); render(); });
  await p.waitForTimeout(80);
  const th=await p.evaluate(()=>{ const e=document.querySelector('.tohandfx');
    return {n:document.querySelectorAll('.tohandfx').length,
            이름:e?(e.querySelector('.tname')||{}).textContent:'',
            폭:e?Math.round(e.getBoundingClientRect().width):0,
            손:S.ai.hand.slice(), shown:JSON.stringify(S.ai.shown)}; });
  ok('되돌아가며 손으로 날아감', th.n===1&&th.이름==='오아네스'&&th.폭>20&&th.폭<200,
     `${th.n}장 "${th.이름}" 폭 ${th.폭}px`);
  await p.waitForTimeout(120);
  const open=await p.evaluate(()=>[...document.querySelectorAll('#foeHand .hcw.open .tname')]
    .map(e=>e.textContent));
  /* 판에서 보고 있던 몸이라 어느 카드가 손으로 갔는지는 원래 양쪽이 다 안다 */
  ok('상대 손에서도 앞면', open.join()==='오아네스'&&/"오아네스":1/.test(th.shown),
     `앞면 [${open}] · shown ${th.shown}`);
  await p.waitForTimeout(700);
  ok('날아간 잔상은 걷힌다',
     (await p.evaluate(()=>document.querySelectorAll('.tohandfx').length))===0, '');

  /* ── 10) 파괴는 **발사체가 닿는 그 순간 한 번만** ── */
  await reset();
  await p.evaluate(()=>{ SPEED=1; window.__dead=[];
    if(!window.__obs){ window.__obs=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.classList&&n.classList.contains('deadfx'))window.__dead.push(performance.now()|0);
    }))); window.__obs.observe(document.body,{childList:true}); }
    S.me.lands=[]; for(let i=0;i<5;i++){S.me.landPlayed=false;playLand('me','파도 지대');}
    placeCreature('ai','오아네스',0); S.ai.board[0].insts.forEach(i=>{i.hp=1;});
    S.me.hand=['환영검 소환']; S.sel=0; S.mode='target';
    window.__t0=performance.now()|0; render(); });
  await p.evaluate(()=>clickSlot('ai',0));
  await p.waitForTimeout(2000);
  const dt=await p.evaluate(()=>window.__dead.map(t=>t-window.__t0));
  /* ⚠ 예전엔 섬광 + '파괴' 라벨을 620ms 보여 준 뒤에야 카드가 깨져서, 맞을 때 한 번
     한참 뒤에 또 한 번 터지는 것처럼 보였다(성권이 '두 번' 으로 잡았다). */
  ok('파괴는 한 번만', dt.length===1, `${dt.length}번 · ${dt.join(', ')}ms`);
  ok('발사체가 닿을 때 부서진다', dt.length===1&&dt[0]>250&&dt[0]<900,
     `발사 뒤 ${dt[0]}ms (발사체 비행 ≈380ms)`);

  /* ── 11) 확대 옆 패널은 **지금 상태**를 설명한다 ── */
  await reset();
  const gl=await p.evaluate(()=>{
    const keys=n=>(glossaryFor(n,S.me.board[0]).match(/class="kn">([^<]+)/g)||[])
      .map(x=>x.replace(/.*>/,'')).join(',')||'(빈칸)';
    S.me.board=[]; placeCreature('me','오아네스',0);
    const 전=keys('오아네스'); resolveOnMine('me','투명화',0);
    const 후=keys('오아네스');
    S.me.board=[]; placeCreature('me','올렝',0);
    const 수호전=keys('올렝'); resolveOnMine('me','투명화',0);
    const 수호후=keys('올렝');
    return {전,후,수호전,수호후};});
  /* 카드에는 '면역' 이라고 떠 있는데 옆 패널이 빈칸이면 어느 쪽을 믿어야 할지 알 수 없다 */
  ok('부여받은 면역을 설명한다', gl.전==='(빈칸)'&&gl.후==='면역', `${gl.전} → ${gl.후}`);
  /* 면역과 수호는 양립하지 않는다 — 풀린 수호를 설명하면 안 된다 */
  ok('풀린 수호는 안 설명한다', gl.수호전==='수호'&&gl.수호후==='면역',
     `${gl.수호전} → ${gl.수호후}`);

  /* ── 12) 주문 환류(투명화)도 손패에서 일렁인다 ── */
  await reset();
  await p.evaluate(()=>{ S.me.hand=['투명화','닉시']; S.me.nospell={};
    S.me.lands=[]; for(let i=0;i<5;i++){S.me.landPlayed=false;playLand('me','파도 지대');}
    S.me.board=[]; placeCreature('me','오아네스',0);
    S.sel=0; pay('me','투명화'); S.me.hand.splice(0,1); render(); });
  await p.waitForTimeout(100);
  const se=await p.evaluate(()=>({
    손:S.me.hand.slice(),
    일렁:[...document.querySelectorAll('#hand .hcw.echoin .tname')].map(e=>e.textContent)}));
  /* ⚠ 주문 환류는 pay() 안에서 손패 맨 뒤에 얹고, 부르는 쪽은 그 뒤에 쓴 카드를 splice 로
     뺀다 — 번호로 표시하면 한 칸 밀려 엉뚱한 자리를 가리킨다(실제로 연출이 안 떴다). */
  ok('주문 환류도 일렁인다', se.일렁.join()==='투명화', `손 [${se.손}] · 일렁 [${se.일렁}]`);

  /* ── 9) 토큰은 원정 보상·상점에 안 나온다 ── */
  const tok=await p.evaluate(()=>{
    const bad=[];
    Object.keys(EL).forEach(el=>{
      poolOf(el).forEach(n=>{ if(POOL[n].tok)bad.push(n); });
      overOf(el).forEach(n=>{ const b=POOL[n].base; if(b&&POOL[b]&&POOL[b].tok)bad.push(n); });
    });
    return {샘:Object.keys(POOL).filter(n=>POOL[n].tok), 샌것:bad};});
  /* ⚠ 해그의 시약 같은 0코 토큰이 보상으로 떴다 — 손에 넣어도 낼 수가 없다 */
  ok('토큰이 표시돼 있다', tok.샘.length>=7, `${tok.샘.length}종`);
  ok('보상·상점에 안 샌다', tok.샌것.length===0, tok.샌것.join(', ')||'0종');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
