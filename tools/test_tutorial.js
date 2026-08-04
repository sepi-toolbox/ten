/* 튜토리얼 — 원정의 첫 전투가 곧 규칙 안내다.
 * ⚠ 손패도 상대 행동도 전부 대본이다. 무작위가 섞이면 "이 카드를 내세요" 를 시킬 수 없다.
 *   node tools/test_tutorial.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  const step=()=>p.evaluate(()=>TUT.step);
  const title=()=>p.evaluate(()=>document.querySelector('#tutbox .tutt')?.textContent||'(없음)');
  /* 단계가 넘어갈 때까지 기다린다 — 발동이 async 라 바로 재면 헛본다 */
  const waitStep=async n=>{ try{ await p.waitForFunction(n=>TUT.step>=n,{timeout:8000},n); }catch(e){} };
  /* 마나를 채워 준다(검사용 — 대본을 따라가는 게 목적이지 마나 관리가 아니다) */
  const mana=()=>p.evaluate(()=>{ S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    while(S.me.lands.length<5){S.me.landPlayed=false;playLand('me','불지옥');}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;}); render(); });

  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(800);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(250);
  await p.evaluate(()=>{SPEED=60;RG.on=false;rgStart('fire');}); await p.waitForTimeout(700);

  const st0=await p.evaluate(()=>({on:TUT.on, 판:!!document.getElementById('tutbox'),
    손:S.me.hand.slice(), 멀리건:document.getElementById('mull').classList.contains('on'),
    지도:document.getElementById('rg').classList.contains('on'),
    상대지형:S.ai.lands.length, 적이름:document.querySelector('#foeBar .who').textContent}));
  /* ⚠ 원정은 이제 **지도가 아니라 전투**로 시작한다 */
  ok('원정이 전투로 시작', st0.on&&st0.판&&!st0.지도, `튜토 ${st0.on} · 안내판 ${st0.판} · 지도 ${st0.지도}`);
  ok('손패가 대본대로', st0.손.join()==='헬시온,화염구,파이어 애로우,헤레스,불지옥,불지옥,불지옥', st0.손.join(' '));
  ok('멀리건은 건너뛴다', st0.멀리건===false, `멀리건 창 ${st0.멀리건}`);
  /* 3코 수호를 첫 차례에 낼 수 있어야 '수호' 안내가 제때 뜬다 */
  ok('훈련 상대 지형 보정', st0.상대지형===3&&st0.적이름==='훈련 상대', `지형 ${st0.상대지형} · ${st0.적이름}`);
  ok('1단계 = 지형', (await title()).includes('지형'), await title());

  await p.evaluate(()=>{ const i=S.me.hand.findIndex(isLand);
    playLand('me',S.me.hand[i]); S.me.hand.splice(i,1); render(); });
  await waitStep(1); ok('지형을 놓으면 2단계', (await title()).includes('크리처'), await title());

  await mana();
  await p.evaluate(()=>{ const i=S.me.hand.indexOf('헤레스'); pay('me','헤레스'); S.me.hand.splice(i,1);
    placeCreature('me','헤레스',0); onSummon('me','헤레스',0); render(); });
  await waitStep(2); ok('소환하면 3단계', (await title()).includes('턴이 끝날 때'), await title());

  await p.evaluate(()=>document.getElementById('end').click());
  await waitStep(3); await p.waitForTimeout(400);
  const t3=await p.evaluate(()=>({턴:S.turn, 상대판:S.ai.board.filter(u=>u&&u.kind==='cr').map(u=>u.name),
    수호:S.ai.board.some(u=>u&&u.g), 헤레스HP:(S.me.board[0]||{}).insts?.[0]?.hp}));
  /* 대본대로 상대가 홉고블린(수호)을 냈고, 내 헤레스는 연소로 1 깎였다 */
  ok('상대가 대본대로 움직인다', t3.상대판.join()==='홉고블린'&&t3.수호,
     `상대 판 [${t3.상대판}] · 수호 ${t3.수호}`);
  ok('4단계 = 연소(방금 본 것)', (await title()).includes('연소'), `${await title()} · 헤레스 HP ${t3.헤레스HP}`);

  await p.click('#tutNext'); await p.waitForTimeout(300);
  ok('5단계 = 수호', (await title()).includes('수호'), await title());
  await p.click('#tutNext'); await p.waitForTimeout(300);
  ok('6단계 = 대상 주문', (await title()).includes('대상'), await title());

  await mana();
  await p.evaluate(async()=>{ S.sel=S.me.hand.indexOf('파이어 애로우'); S.mode='target';
    await clickSlot('ai',0); });
  await waitStep(6); ok('주문을 쏘면 7단계', (await title()).includes('본체'), await title());

  await mana();
  const hp0=await p.evaluate(()=>S.ai.hp);
  await p.evaluate(async()=>{ S.sel=S.me.hand.indexOf('화염구'); S.mode='target';
    await clickSlot('ai',FACE); });
  await waitStep(7); await p.waitForTimeout(300);
  const hp1=await p.evaluate(()=>S.ai.hp);
  ok('본체를 쏘면 마지막 단계', (await title()).includes('여기까지')&&hp1<hp0,
     `${await title()} · 상대 HP ${hp0}→${hp1}`);

  /* 마지막 — 지도로 나간다 */
  await p.click('#tutNext'); await p.waitForTimeout(1200);
  const fin=await p.evaluate(()=>({튜토:TUT.on, 안내판:!!document.getElementById('tutbox'),
    지도:document.getElementById('rg').classList.contains('on'), 층:RG.floor}));
  ok('끝나면 지도로', fin.튜토===false&&!fin.안내판&&fin.지도, JSON.stringify(fin));

  /* 건너뛰기 — 언제든 바로 지도로 */
  await p.evaluate(()=>{RG.on=false;rgStart('water');}); await p.waitForTimeout(700);
  ok('건너뛰기 버튼이 있다', !!(await p.$('#tutSkip')), '');
  await p.click('#tutSkip'); await p.waitForTimeout(1200);
  const sk=await p.evaluate(()=>({튜토:TUT.on, 안내판:!!document.getElementById('tutbox'),
    지도:document.getElementById('rg').classList.contains('on')}));
  ok('건너뛰면 바로 지도로', sk.튜토===false&&!sk.안내판&&sk.지도, JSON.stringify(sk));

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
