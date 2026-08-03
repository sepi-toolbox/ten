/* 지형존 동작 — 쓴 지형이 뒤집히는가 · 왼쪽부터 소모되는가 · 다음 내 턴에 돌아오는가 ·
 * 뒤집힌 지형도 길게 눌러 볼 수 있는가 · 자원 이동 연출이 지불한 속성 색으로 뜨는가
 * 그리고 탭 발동 제거 · 취소 버튼 제거 · 빈 판 안내 문구
 *   node tools/test_lands.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(800);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(350);

  // 1) 빈 판 안내 문구
  const ph=await p.evaluate(()=>[getComputedStyle(document.getElementById('myBoard'),'::after').content,
                                 getComputedStyle(document.getElementById('myLz'),'::after').content]);
  ok('빈 판 문구', /크리처/.test(ph[0])&&/지형/.test(ph[1]), ph.join(' · '));

  // 2) 취소 버튼 없음 · 턴 배너는 턴 수만
  ok('취소 버튼 없음', !(await p.$('#cancel')), '');
  /* 가운데 조작 줄은 조작 안내로 되돌렸다(턴 표시만 하던 판에서 원복) */
  const h1=await p.evaluate(()=>{S.active='me';S.busy=false;render();
    return document.getElementById('hint').textContent.replace(/\s+/g,' ').trim();});
  const h2=await p.evaluate(()=>{S.active='ai';render();
    return document.getElementById('hint').textContent.replace(/\s+/g,' ').trim();});
  await p.evaluate(()=>{S.active='me';render();});
  ok('조작 줄 = 안내 문구', /끌어/.test(h1)&&/상대 턴/.test(h2), `"${h1}" / "${h2}"`);
  /* 턴 배너는 상자 없이 글자만 떴다 사라진다. 아래 그라데이션 바도 지웠다. */
  const ban=await p.evaluate(()=>{turnBanner('me');
    const e=document.querySelector('.turnban .tb1'), c=getComputedStyle(e);
    const r={bg:c.backgroundColor,bd:c.borderStyle,bar:document.querySelectorAll('.turnban .bar').length,
      txt:e.textContent.replace(/\s+/g,' ').trim()};
    document.querySelector('.turnban').remove(); return r;});
  ok('턴 배너 = 맨 글자', /rgba\(0, 0, 0, 0\)|transparent/.test(ban.bg)&&ban.bd==='none'&&ban.bar===0
     &&/TURN/.test(ban.txt)&&/내 턴/.test(ban.txt),
     `배경 ${ban.bg} · 테두리 ${ban.bd} · 바 ${ban.bar}개 · "${ban.txt}"`);

  // 3) 지형 6장을 깔고 카드 한 장을 끌어 낸다
  await p.evaluate(()=>{SPEED=6; setDeck('fire');}); await p.waitForTimeout(250);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);
  await p.evaluate(()=>{
    S.me.lands=[]; for(let i=0;i<6;i++){S.me.landPlayed=false;playLand('me','화산');}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    while(S.me.hand.length<7)draw('me');
    const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c>=2&&POOL[n].c<=3)
      .sort((a,b)=>POOL[a].c-POOL[b].c)[0];
    S.me.hand[S.me.hand.length-1]=cr; window.__c=cr; render();});
  await p.waitForTimeout(300);

  // 3-a) 탭은 아무 일도 하지 않는다
  const el=await p.$('#hand .hcw:last-child'); const bx=await el.boundingBox();
  await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2); await p.waitForTimeout(300);
  ok('탭으로는 안 나간다', await p.evaluate(()=>S.sel)===null&&await p.evaluate(()=>S.me.board.filter(x=>x).length)===0,
     `sel=${await p.evaluate(()=>S.sel)} · 보드 ${await p.evaluate(()=>S.me.board.filter(x=>x).length)}`);

  // 3-b) 끌어내면 소환되고, 왼쪽 지형부터 뒤집힌다
  const board=await (await p.$('#myBoard')).boundingBox();
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2); await p.mouse.down();
  await p.mouse.move(bx.x+bx.width/2,bx.y-50,{steps:4});
  await p.mouse.move(board.x+board.width/2,board.y+board.height/2,{steps:6});
  await p.mouse.up(); await p.waitForTimeout(120);
  const st=await p.evaluate(()=>({
    비용:POOL[window.__c].c, 카드:window.__c,
    소모:S.me.lands.map(l=>l.used?'X':'O').join(''),
    뒷면:document.querySelectorAll('#myLz .slot.used .cback').length,
    앞면:document.querySelectorAll('#myLz .slot:not(.used) .tcard').length,
    뒤집기:document.querySelectorAll('#myLz .slot.flip').length,
    알갱이:document.querySelectorAll('.mspark').length,
    색:(document.querySelector('.mspark')||{style:{getPropertyValue:()=>''}}).style.getPropertyValue('--c'),
    불색:EL.fire.c, 배지:document.querySelector('#myLz .lzb').textContent,
    보드:S.me.board.filter(x=>x).length}));
  const 왼쪽부터='X'.repeat(st.비용)+'O'.repeat(6-st.비용);
  ok('끌면 소환된다', st.보드===1, `${st.카드}(${st.비용}코)`);
  ok('왼쪽부터 소모', st.소모===왼쪽부터, `${st.소모} (기대 ${왼쪽부터})`);
  ok('쓴 지형은 뒷면', st.뒷면===st.비용&&st.앞면===6-st.비용&&st.뒤집기===st.비용,
     `뒷면 ${st.뒷면} · 앞면 ${st.앞면} · 뒤집기 애니 ${st.뒤집기}`);
  ok('배지 = 남은/전체', st.배지===`${6-st.비용}/6`, `"${st.배지}"`);
  ok('자원 이동 연출', st.알갱이===st.비용&&st.색.toLowerCase()===st.불색.toLowerCase(),
     `알갱이 ${st.알갱이}개 · 색 ${st.색}(불 ${st.불색})`);
  await p.waitForTimeout(600);
  ok('알갱이는 스스로 사라진다', (await p.evaluate(()=>document.querySelectorAll('.mspark').length))===0, '');

  // 4) 뒤집힌 지형도 길게 눌러 볼 수 있다
  const us=await p.$('#myLz .slot.used'); const ub=await us.boundingBox();
  await p.mouse.move(ub.x+ub.width/2,ub.y+ub.height/2); await p.mouse.down(); await p.waitForTimeout(620);
  const z=await p.evaluate(()=>({on:document.getElementById('zoom').classList.contains('on'),
    nm:(document.querySelector('#zoom .tname')||{}).textContent||''}));
  await p.mouse.up(); await p.evaluate(()=>{hideZoom();lpFired=false;}); await p.waitForTimeout(200);
  ok('뒤집힌 지형도 확대', z.on&&z.nm==='화산', `"${z.nm}"`);
  // 앞면 지형도 마찬가지
  const rd=await p.$('#myLz .slot:not(.used)'); const rb=await rd.boundingBox();
  await p.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2); await p.mouse.down(); await p.waitForTimeout(620);
  const z2=await p.evaluate(()=>document.getElementById('zoom').classList.contains('on'));
  await p.mouse.up(); await p.evaluate(()=>{hideZoom();lpFired=false;}); await p.waitForTimeout(200);
  ok('앞면 지형도 확대', z2, '');

  // 5) 가운데 동그란 자원 마커는 없앴다
  ok('자원 마커 없음', (await p.evaluate(()=>document.querySelectorAll('#myLz .tok').length))===0, '.tok 0개');

  // 6) 다음 내 턴이 시작되면 전부 앞면으로 — **돌아올 때도 뒤집기 연출**을 탄다
  await p.evaluate(()=>{SPEED=1;S.turn++; startTurn('me');}); await p.waitForTimeout(90);
  const back=await p.evaluate(()=>({뒷면:document.querySelectorAll('#myLz .slot.used').length,
    used:S.me.lands.filter(l=>l.used).length,
    뒤집기:document.querySelectorAll('#myLz .slot.flip').length,
    애니:[...document.querySelectorAll('#myLz .slot.flip .lface')]
          .map(e=>getComputedStyle(e).animationName)[0]||'none'}));
  ok('내 턴에 전부 앞면', back.뒷면===0&&back.used===0, `뒤집힌 지형 ${back.뒷면}장`);
  ok('돌아올 때도 뒤집힌다', back.뒤집기>0&&back.애니==='lflip',
     `${back.뒤집기}칸에 ${back.애니}`);
  await p.waitForTimeout(700); await p.evaluate(()=>render()); await p.waitForTimeout(120);
  ok('연출은 한 번만', (await p.evaluate(()=>document.querySelectorAll('#myLz .slot.flip').length))===0,
     '다시 그려도 재생 안 됨');

  // 7) 조작 줄 위아래 여백이 대칭인가
  await p.evaluate(()=>{S.ai.board=[];for(let i=0;i<3;i++){placeCreature('me','파수병');placeCreature('ai','파수병');}render();});
  await p.waitForTimeout(300);
  const gp=await p.evaluate(()=>{const g=s=>{const r=document.querySelector(s).getBoundingClientRect();
    return [Math.round(r.top),Math.round(r.bottom)];};
    const fb=g('#foeBoard'),ct=g('.ctl'),mb=g('#myBoard');
    return {위:ct[0]-fb[1], 아래:mb[0]-ct[1]};});
  ok('조작 줄 위아래 대칭', Math.abs(gp.위-gp.아래)<=2&&gp.위>4, `위 ${gp.위}px / 아래 ${gp.아래}px`);

  // 8) 대상이 없어 못 쓰는 카드도 손패에서 흐려진다
  const dim=await p.evaluate(()=>{
    S.me.lands=[]; for(let i=0;i<10;i++){S.me.landPlayed=false;playLand('me','화산');}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    S.ai.board=[]; S.me.board=[];
    const tsp=Object.keys(POOL).find(n=>POOL[n].k==='sp'&&POOL[n].el==='fire'&&POOL[n].c<=3
      &&!INSTANT.includes(POOL[n].mode)&&POOL[n].mode!=='summon'&&!NEEDS_MINE.includes(POOL[n].mode));
    const cr=Object.keys(POOL).find(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=3);
    S.me.hand=[tsp,cr]; render();
    const before=[...document.querySelectorAll('#hand .hcw')].map(e=>e.classList.contains('no'));
    const why=whyNotPlayable(tsp);
    placeCreature('ai',cr); render();
    const after=[...document.querySelectorAll('#hand .hcw')].map(e=>e.classList.contains('no'));
    return {tsp,cr,before,after,why};});
  ok('대상 없으면 흐림', dim.before[0]===true&&dim.before[1]===false&&dim.after[0]===false,
     `${dim.tsp}: 대상 없을 때 흐림 ${dim.before[0]}(${dim.why}) → 대상 생기면 ${dim.after[0]}`
     +` · ${dim.cr}: ${dim.before[1]}`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
