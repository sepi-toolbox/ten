/* 설정 서랍(스크롤·터치) · 로딩 3종 검사
 *   node tools/test_ui.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  /* goto 는 기본으로 load 를 기다린다 — 그 사이 스플래시가 이미 걷힌다. commit 으로 먼저 잡는다 */
  await p.goto(FILE,{waitUntil:'commit'});
  // 1) 시작 스플래시가 떴다가 사라진다
  await p.waitForTimeout(60);
  const bootOn=await p.$eval('#boot',e=>!e.classList.contains('off'));
  await p.waitForTimeout(1400);
  const bootOff=await p.$eval('#boot',e=>e.classList.contains('off'));
  ok('시작 로딩', bootOn&&bootOff, `초기 표시 ${bootOn} → 자동 해제 ${bootOff}`);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);

  // 2) 서랍 — 열고, 안을 눌러도 닫히지 않고, 스크롤된다
  /* 로그를 채워 서랍이 실제로 넘치게 만든 뒤 스크롤을 본다 */
  await p.evaluate(()=>{for(let i=0;i<40;i++)log('로그 채우기 '+i,'t');});
  await p.click('#gearBtn'); await p.waitForTimeout(400);
  const st=await p.evaluate(()=>{
    const s=document.getElementById('side'), r=s.getBoundingClientRect();
    const el=document.elementFromPoint(Math.round(r.left+r.width/2),Math.round(r.top+30));
    return {열림:document.body.classList.contains('sideon'),
      화면안:r.top<innerHeight-40,
      맨위요소:el?el.tagName+'.'+(el.className||el.id||''):null,
      서랍안:!!(el&&el.closest&&el.closest('#side')),
      스크롤가능:s.scrollHeight>s.clientHeight+2};});
  ok('서랍이 맨 위에 온다', st.서랍안, `가장 위 요소 ${st.맨위요소}`);
  // 안쪽 탭 → 닫히면 안 된다
  const sr=await (await p.$('#side')).boundingBox();
  await p.mouse.click(sr.x+sr.width/2, sr.y+30); await p.waitForTimeout(250);
  ok('안쪽 탭에 안 닫힘', await p.evaluate(()=>document.body.classList.contains('sideon')), '');
  // 스크롤 — 팝업 자체 또는 안쪽 로그 중 넘치는 쪽이 스크롤되면 된다
  const scroll=async sel=>{
    const el=await p.$(sel); const r=await el.boundingBox();
    const b0=await p.evaluate(s=>document.querySelector(s).scrollTop,sel);
    await p.mouse.move(r.x+r.width/2, r.y+r.height*0.6);
    await p.mouse.wheel(0,-320); await p.waitForTimeout(250);   /* 로그는 이미 맨 아래라 위로 굴린다 */
    return [b0, await p.evaluate(s=>document.querySelector(s).scrollTop,sel)];
  };
  const [l0,l1]=await scroll('#log');
  const [s0,s1]=await scroll('#side');
  ok('팝업 스크롤', l1!==l0||s1!==s0, `로그 ${l0}→${l1} · 팝업 ${s0}→${s1}`);
  // 바깥 탭 → 닫힌다
  await p.mouse.click(10,10); await p.waitForTimeout(300);
  ok('바깥 탭에 닫힘', !(await p.evaluate(()=>document.body.classList.contains('sideon'))), '');

  // 3) 전환 가리개
  await p.evaluate(()=>{SPEED=1;veilRun('테스트 전환…',()=>{},400);});
  await p.waitForTimeout(120);
  const vOn=await p.$eval('#veil',e=>e.classList.contains('on'));
  await p.waitForTimeout(900);
  const vOff=await p.$eval('#veil',e=>!e.classList.contains('on'));
  ok('전환 로딩(가림)', vOn&&vOff, `표시 ${vOn} → 해제 ${vOff}`);

  // 4) 가리지 않는 로딩 — 조작은 막고 화면은 보인다
  await p.evaluate(()=>{S.busy=true;render();}); await p.waitForTimeout(200);
  const bs=await p.evaluate(()=>{
    const el=document.getElementById('busy'), cs=getComputedStyle(el);
    const bd=document.getElementById('myBoard').getBoundingClientRect();
    const hit=document.elementFromPoint(Math.round(bd.left+bd.width/2),Math.round(bd.top+bd.height/2));
    return {표시:el.classList.contains('on'), 배경투명:cs.backgroundColor==='rgba(0, 0, 0, 0)',
      조작차단:hit===el, 문구:document.getElementById('busyTxt').textContent};});
  ok('처리 중 로딩(안 가림)', bs.표시&&bs.배경투명&&bs.조작차단,
     `배경 투명 ${bs.배경투명} · 입력 차단 ${bs.조작차단} · "${bs.문구}"`);
  await p.evaluate(()=>{S.busy=false;render();}); await p.waitForTimeout(200);
  ok('처리 끝나면 해제', !(await p.$eval('#busy',e=>e.classList.contains('on'))), '');
  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
