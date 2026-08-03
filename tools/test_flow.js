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
  ok('모드 2개', (await p.$$eval('#page .chsi',e=>e.length))===2, '배틀 · 원정');

  // 배틀 흐름
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
  await p.click('#page .chsi[data-e="nature"]'); await p.waitForTimeout(900);
  ok('원정 → 지도', await p.evaluate(()=>RG.on&&document.getElementById('rg').classList.contains('on')),
     `층 ${await p.evaluate(()=>RG.map?RG.map.length:0)}개`);

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
