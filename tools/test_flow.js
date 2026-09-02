/* 앱 흐름 — 모드 → 덱 → (상대 덱 | 지도) → 게임, 패배 후 되돌아가기
 *   node tools/test_flow.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1500);
  const pg=()=>p.evaluate(()=>PAGE);
  const txt=()=>p.$eval('#page .pgh',e=>e.textContent).catch(()=>'-');

  ok('시작 = 모드 선택', await pg()==='mode', `제목 "${await txt()}"`);
  /* ⚠ 세 갈래다 — 원정 · 대전 · **엘리멘츠 대전**.
     엘리멘츠는 규칙이 다른 게임이라 이 흐름을 안 타고 etg/ 페이지로 나간다.
     그래서 여기서는 '단추가 있고 그 주소를 가리키는가' 까지만 본다. */
  const modes=await p.$$eval('#page .chsi',e=>e.map(x=>x.dataset.m));
  ok('모드 3개', modes.length===3&&modes.includes('etg'), modes.join(' · '));

  // 대전 흐름
  await p.click('#page .chsi[data-m="battle"]'); await p.waitForTimeout(700);
  ok('→ 덱 선택', await pg()==='deck', `제목 "${await txt()}" · 후보 ${await p.$$eval('#page .chsi',e=>e.length)}종`);
  await p.click('#page .chsi[data-e="fire"]'); await p.waitForTimeout(700);
  ok('→ 상대 덱 선택', await pg()==='foedeck', `제목 "${await txt()}"`);
  // 뒤로
  await p.click('#pgBack'); await p.waitForTimeout(600);
  ok('뒤로 = 덱 선택', await pg()==='deck', '');
  await p.click('#page .chsi[data-e="fire"]'); await p.waitForTimeout(700);
  await p.click('#page .chsi[data-e="water"]'); await p.waitForTimeout(900);
  const st=await p.evaluate(()=>({page:PAGE,on:document.getElementById('page').classList.contains('on'),
    my:FLOW.my,foe:FLOW.foe,
    내덱:[...new Set(S.me.deck.concat(S.me.hand).filter(n=>POOL[n]).map(n=>POOL[n].el))],
    상대덱:[...new Set(S.ai.deck.concat(S.ai.hand).filter(n=>POOL[n]).map(n=>POOL[n].el))]}));
  ok('→ 게임 시작', !st.on&&st.내덱.join()==='fire'&&st.상대덱.join()==='water',
     `내 ${st.내덱} vs 상대 ${st.상대덱}`);

  // 패배 → 다시 도전하기 / 초기 화면
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(300);
  await p.evaluate(()=>{S.me.hp=0;checkEnd();}); await p.waitForTimeout(400);
  ok('패배 화면 버튼', (await p.$$eval('#over button',e=>e.map(x=>x.textContent).join('/')))==='다시 도전하기/초기 화면',
     await p.$$eval('#over button',e=>e.map(x=>x.textContent).join(' · ')));
  await p.click('#again'); await p.waitForTimeout(800);
  ok('다시 도전 = 덱 선택', await pg()==='deck', '');
  await p.click('#page .chsi[data-e="dark"]'); await p.waitForTimeout(700);
  await p.click('#page .chsi[data-e="?"]'); await p.waitForTimeout(900);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{S.me.hp=0;checkEnd();}); await p.waitForTimeout(400);
  await p.click('#toHome'); await p.waitForTimeout(800);
  ok('초기 화면 = 모드 선택', await pg()==='mode', '');

  // 원정 흐름
  await p.click('#page .chsi[data-m="rogue"]'); await p.waitForTimeout(700);
  ok('원정 → 덱 선택', await pg()==='deck', '');
  /* ⚠ 튜토리얼은 지금 **꺼져 있다**(TUT_ON — 성권 지시로 더 다듬은 뒤 다시 켠다).
     그래서 어느 속성으로 시작하든 **곧장 지도**여야 한다. 대본이 있는 불도 마찬가지다.
     ⚠ 속성 이름을 박지 않는다 — 스위치와 tutHas 에게 물어본다. 다시 켜는 날
       이 검사가 조용히 틀린 걸 보게 되면 안 된다. */
  ok('튜토리얼은 지금 꺼져 있다',
     await p.evaluate(()=>TUT_ON===false&&Object.keys(TUTS).length>0),
     `TUT_ON ${await p.evaluate(()=>TUT_ON)} · 대본은 ${await p.evaluate(()=>Object.keys(TUTS).join('·'))} 남아 있음`);
  await p.click('#page .chsi[data-e="fire"]'); await p.waitForTimeout(1200);
  ok('원정 → 바로 지도',
     await p.evaluate(()=>!TUT.on&&RG.on&&document.getElementById('rg').classList.contains('on')),
     `층 ${await p.evaluate(()=>RG.map?RG.map.length:0)}개`);
  /* ?tut=1 로 열면 대본이 그대로 돈다 — 지운 게 아니라 잠가 둔 것이라는 증거 */
  /* ⚠ p.context().newPage() 는 기본 컨텍스트에서 막힌다 — 브라우저에서 직접 연다. */
  const tp=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await tp.goto(FILE+'?tut=1'); await tp.waitForTimeout(1200);
  await tp.click('#page .chsi[data-m="rogue"]'); await tp.waitForTimeout(700);
  await tp.click('#page .chsi[data-e="fire"]'); await tp.waitForTimeout(1200);
  ok('?tut=1 이면 대본이 돈다',
     await tp.evaluate(()=>TUT.on&&!!document.getElementById('tutbox')),
     `튜토 ${await tp.evaluate(()=>TUT.on)}`);
  await tp.close();

  // 설정 팝업 — 가운데 사각 + 버전
  await p.evaluate(()=>{rgClose();}); await p.waitForTimeout(200);
  await p.click('#gearBtn'); await p.waitForTimeout(400);
  const opt=await p.evaluate(()=>{
    const s=document.getElementById('side'), r=s.getBoundingClientRect();
    return {가운데:Math.abs((r.left+r.right)/2-innerWidth/2)<3&&Math.abs((r.top+r.bottom)/2-innerHeight/2)<3,
      폭:Math.round(r.width), 버전:document.getElementById('verTag').textContent};});
  ok('설정 = 가운데 팝업', opt.가운데, `폭 ${opt.폭}px · 화면 중앙`);
  ok('버전 표시', /v\d+\.\d+\.\d+/.test(opt.버전), `"${opt.버전}"`);
  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
