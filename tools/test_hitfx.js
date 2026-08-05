/* 전투 연출 — 상태 표시(비행·수호·면역·환류)와 때리는 연출(달려듦·연격·연합·
 * 폭발·연소·흡혈·광분)
 *   node tools/test_hitfx.js
 *
 * 왜 이 파일이 있나 — 연출은 **틀려도 검사가 안 죽는다.** 그리고 이 묶음은 특히
 * 조용히 사라진다: 슬롯에 클래스로 건 연출은 **바로 다음 render() 가 통째로 날린다.**
 * 광분 광채 · 피격 반동 · 연소 불꽃이 실제로 그렇게 한 번도 안 보였다.
 * 그래서 '화면에 무엇이 몇 개 붙었는가' 를 직접 센다.
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
  await p.evaluate(()=>{SPEED=1;setDeck('fire');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(350);
  /* 몸에 붙는 연출은 **생성 순간**을 세야 한다 — 잠깐 떴다 사라지므로 나중에 보면 없다 */
  await p.evaluate(()=>{ window.C={trace:0,bolt:0,burst:0,burn:0};
    new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
      if(!n.classList)return;
      if(n.classList.contains('trace'))C.trace++;
      if(n.classList.contains('bolt'))C.bolt++;
      if(n.classList.contains('burstfx'))C.burst++;
      if(n.classList.contains('burnfx'))C.burn++;
    }))).observe(document.body,{childList:true}); });
  const need=async n=>{ if(!await p.evaluate(x=>!!POOL[x],n))throw new Error('POOL 에 없는 카드: '+n); };
  const zero=()=>p.evaluate(()=>{window.C={trace:0,bolt:0,burst:0,burn:0};});
  const C=()=>p.evaluate(()=>({...window.C}));
  for(const n of ['하피','홉고블린','전기 해파리','고스트','켈베로스','리자드 전사','헬하운드',
                  '블러드서커','파이어버그','아제르','미노타 도끼병'])await need(n);

  /* ── 1) 상태를 몸으로 보여 준다 ── */
  const st=await p.evaluate(()=>{
    S.me.board=[];S.ai.board=[];
    ['하피','홉고블린','전기 해파리','고스트'].forEach((n,i)=>placeCreature('me',n,i));
    render();
    const cs=[...document.querySelectorAll('#myBoard .slot')].map(e=>e.className);
    const g=n=>getComputedStyle(document.querySelector(n));
    return {클래스:cs,
      부유:g('#myBoard .slot.fly .tart').animationName,
      방패:g('#myBoard .slot.guard .tb.h').borderRadius,
      동그라미:g('#myBoard .slot:not(.guard):not(.flyguard) .tb.h').borderRadius,
      프리즘:getComputedStyle(document.querySelector('#myBoard .slot.veilon .tart'),'::before').animationName,
      환류:g('#myBoard .slot.echoon .tcard').animationName};});
  ok('비행은 떠 있다', st.부유==='hover', st.부유);
  /* 수호만 방패꼴 — 나머지는 동그라미 그대로여야 구별이 된다 */
  ok('수호 HP 는 방패꼴', /%/.test(st.방패)&&st.방패!==st.동그라미,
     `수호 ${st.방패} · 보통 ${st.동그라미}`);
  ok('면역은 프리즘', st.프리즘==='prism', st.프리즘);
  ok('환류가 남으면 파란 일렁임', st.환류==='glowecho', st.환류);
  /* 환류를 다 쓴 몸에는 안 붙는다 = 남았는지 한눈에 갈린다 */
  const spent=await p.evaluate(()=>{ const u=S.me.board.find(x=>x&&x.echo); u.echo=false; render();
    return document.querySelectorAll('#myBoard .slot.echoon').length;});
  ok('다 쓴 환류는 안 빛난다', spent===0, `${spent}개`);

  /* ── 2) 때리는 연출 — 달려들어 박는다 ── */
  /* ⚠ **지상 공격자**여야 한다 — 비행은 지상 수호를 지나쳐 얼굴을 때리므로
     맞는 '몸' 이 없어 반동이 뜰 자리가 없다(그렇게 짰다가 헛봤다). */
  await p.evaluate(()=>{ SPEED=1; S.me.board=[];S.ai.board=[];
    placeCreature('me','헬하운드',0); placeCreature('ai','홉고블린',0);
    S.ai.board[0].insts.forEach(i=>{i.hp=99;}); S.gen++; render(); });
  await p.waitForTimeout(120);
  const run=p.evaluate(()=>resolveAttacks('me'));
  let moved=0, bumped=0;
  for(let i=0;i<22;i++){ await p.waitForTimeout(45);
    const r=await p.evaluate(()=>({m:!!(document.querySelector('#myBoard .slot')||{}).style?.transform,
      b:document.querySelectorAll('.slot.bumped').length}));
    if(r.m)moved++; if(r.b)bumped++; }
  await run;
  ok('공격자가 달려든다', moved>0, `옮겨진 프레임 ${moved}`);
  ok('맞은 쪽이 밀린다', bumped>0, `반동 프레임 ${bumped}`);
  /* ⚠ 끝나면 제자리로 — transform 이 남으면 판이 어긋난 채로 굳는다 */
  ok('끝나면 제자리', (await p.evaluate(()=>
    [...document.querySelectorAll('.slot')].every(e=>!e.style.transform)))===true, '');

  /* ── 3) 연격 — 화살표는 한 번, 공격은 여러 번 ── */
  await zero();
  const multi=await p.evaluate(async()=>{ S.me.board=[];S.ai.board=[];
    placeCreature('me','켈베로스',0); placeCreature('ai','홉고블린',0);
    const t=S.ai.board[0]; t.insts.forEach(i=>{i.hp=99;i.mh=99;});
    const a=S.me.board[0].a, n=S.me.board[0].multi;
    S.gen++; render(); await resolveAttacks('me');
    return {atk:a,multi:n,깎임:99-t.insts[0].hp};});
  const c3=await C();
  ok('연격 = 화살표 한 번', c3.trace===1, `화살표 ${c3.trace}개`);
  ok('연격 = 여러 번 때린다', multi.깎임===multi.atk*multi.multi,
     `${multi.atk} × ${multi.multi} = ${multi.깎임} 깎임`);

  /* ── 4) 연합 — 한 번 겨누고 동명 아군이 따라 친다 ── */
  await zero();
  const ally=await p.evaluate(async()=>{ S.me.board=[];S.ai.board=[];
    placeCreature('me','리자드 전사',0);
    placeCreature('ai','홉고블린',0);
    const t=S.ai.board[0]; t.insts.forEach(i=>{i.hp=99;i.mh=99;});
    S.gen++; render(); await resolveAttacks('me');
    return 99-t.insts[0].hp;});
  const c4=await C();
  ok('연합 = 한 번만 겨눈다', c4.trace===1, `화살표 ${c4.trace}개 (혼자면 따라 칠 아군이 없다)`);

  /* ── 5) 폭발 — 진짜 터지고 그 값이 상대에게 날아간다 ── */
  await zero();
  const boom=await p.evaluate(()=>{ S.me.board=[];S.ai.board=[];S.ai.hp=60;
    placeCreature('me','파이어버그',0); render();
    const a=S.me.board[0].a;
    S.me.board[0].insts.forEach(i=>{i.hp=0;}); cleanup('me');
    return {atk:a, 상대:S.ai.hp};});
  const c5=await C();
  ok('폭발이 터진다', c5.burst===1, `폭발 ${c5.burst}개`);
  ok('터진 값이 날아간다', c5.bolt===1&&boom.상대===60-boom.atk,
     `발사체 ${c5.bolt}개 · 상대 HP 60→${boom.상대} (ATK ${boom.atk})`);

  /* ── 6) 연소 — 턴 종료에 불이 오르고 수치가 뜬다 ── */
  await zero();
  await p.evaluate(()=>{ S.me.board=[];S.ai.board=[];
    placeCreature('me','아제르',0); render(); });
  await p.evaluate(()=>endStep('me'));
  await p.waitForTimeout(400);
  const c6=await C();
  const pop=await p.evaluate(()=>[...document.querySelectorAll('.hitpop')].map(e=>e.textContent));
  /* ⚠ 슬롯 클래스로 걸면 endStep 끝의 render() 가 날린다 — 떠 있는 요소여야 한다 */
  ok('연소는 불이 오른다', c6.burn===1, `불꽃 ${c6.burn}개`);
  ok('연소 피해가 숫자로 뜬다', pop.length>0&&/^-\d+$/.test(pop[0]), pop.join(',')||'(없음)');

  /* ── 7) 흡혈 — 맞은 쪽에서 때린 몸으로 빨려 들어간다 ── */
  await zero();
  const drain=await p.evaluate(async()=>{ S.me.board=[];S.ai.board=[];
    placeCreature('me','블러드서커',0);
    const u=S.me.board[0]; u.insts.forEach(i=>{i.mh=9;i.hp=1;});
    placeCreature('ai','홉고블린',0);
    S.ai.board[0].insts.forEach(i=>{i.hp=99;i.mh=99;});
    S.gen++; render(); await resolveAttacks('me');
    return S.me.board[0].insts[0].hp;});
  const c7=await C();
  /* ⚠ 회복 대상은 본체가 아니라 **그 크리처 자신**이다(2026-08 규칙) — 발사체도 그 몸으로 */
  ok('흡혈이 몸으로 들어온다', c7.bolt===1&&drain>1, `발사체 ${c7.bolt}개 · HP 1→${drain}`);

  /* ── 8) 광분 — 맞으면 붉게 달아올라 한 번 더 친다 ── */
  await zero();
  await p.evaluate(()=>{ S.me.board=[];S.ai.board=[];S.ai.hp=60;
    placeCreature('me','미노타 도끼병',0);
    S.me.board[0].insts.forEach(i=>{i.hp=20;i.mh=20;}); render(); });
  await p.waitForTimeout(80);
  /* ⚠ 광분은 **맞아야** 켜진다 — 막는 쪽은 반격하지 않으므로 공격만으로는 절대 안 켜진다 */
  await p.evaluate(()=>{ const u=S.me.board[0]; hurt(u,u.insts[0],3); render(); });
  await p.waitForTimeout(90);
  const rage=await p.evaluate(()=>({빛:document.querySelectorAll('.slot.raging').length,
    상대:S.ai.hp}));
  const c8=await C();
  ok('광분은 붉게 빛난다', rage.빛===1, `${rage.빛}개`);
  ok('광분이 한 번 더 친다', c8.bolt===1&&rage.상대<60,
     `발사체 ${c8.bolt}개 · 상대 HP 60→${rage.상대}`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
