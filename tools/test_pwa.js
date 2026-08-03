/* 앱 설치(PWA) 준비 상태 · 상대 손패 규격 · 대상 지정 UI 검사
 *   node tools/test_pwa.js */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..','prototype');
const FILE='file://'+path.join(ROOT,'index.html');
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  // 1) 정적 파일
  const man=JSON.parse(fs.readFileSync(path.join(ROOT,'manifest.webmanifest'),'utf8'));
  ok('매니페스트', man.display==='standalone'&&man.icons.length>=3&&!!man.start_url,
     `display=${man.display} · 아이콘 ${man.icons.length}종`);
  ok('아이콘 파일', ['icon-192.png','icon-512.png','icon-maskable.png','apple-touch-icon.png']
     .every(f=>fs.existsSync(path.join(ROOT,f))), '4종 존재');
  ok('서비스워커', fs.existsSync(path.join(ROOT,'sw.js')), 'sw.js');
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  ok('메타 태그', /rel="manifest"/.test(html)&&/apple-mobile-web-app-capable/.test(html)
     &&/viewport-fit=cover/.test(html), 'manifest · apple-capable · viewport-fit');

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(700);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{SPEED=30;setDeck('fire');}); await p.waitForTimeout(250);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);

  // 2) 상대 손패가 내 손패와 같은 규격
  await p.evaluate(()=>{ while(S.ai.hand.length<6)draw('ai'); while(S.me.hand.length<6)draw('me'); render(); });
  await p.waitForTimeout(300);
  const sz=await p.evaluate(()=>{
    const me=document.querySelector('#hand .hcw .tcard').getBoundingClientRect();
    const foe=document.querySelector('#foeHand .cback').getBoundingClientRect();
    return {me:[+me.width.toFixed(1),+me.height.toFixed(1)],foe:[+foe.width.toFixed(1),+foe.height.toFixed(1)]};});
  /* 상대 손패는 뒷면뿐이라 정보가 없다 — 내 손패와 같은 크기로 두면 화면 위쪽을 너무 먹는다.
     --foecw = cardw × 0.48 로 되돌렸다(한 번 같은 크기로 키웠다가 '가린다'는 지적을 받음). */
  const 비율=sz.foe[0]/sz.me[0];
  ok('상대 손패는 작다', 비율>0.4&&비율<0.58&&Math.abs(sz.foe[1]/sz.foe[0]-1.4)<0.08,
     `내 ${sz.me.join('×')} · 상대 ${sz.foe.join('×')} (${Math.round(비율*100)}%)`);
  ok('상대 손패는 뒷면', await p.evaluate(()=>document.getElementById('foeHand').textContent.trim()===''), '글자 없음');
  /* 뒷면 카드가 상대 HP 바를 덮으면 안 된다 — .hand 의 음수 margin-bottom 이 새어 들어와 실제로 덮었다 */
  ok('상대 바를 안 가린다', await p.evaluate(()=>{
    const c=document.querySelector('#foeHand .cback').getBoundingClientRect();
    const b=document.getElementById('foeBar').getBoundingClientRect();
    return c.bottom<=b.top+1;}), '뒷면 아래에 HP 바');

  // 2-b) 글자 선택·화면 확대 잠금
  const lock=await p.evaluate(()=>({
    본문:getComputedStyle(document.body).userSelect,
    안내:getComputedStyle(document.getElementById('hint')).userSelect,
    라벨:getComputedStyle(document.getElementById('lbMyB')).userSelect,
    터치:getComputedStyle(document.body).touchAction,
    메타:(document.querySelector('meta[name=viewport]')||{}).content||''}));
  ok('글자 선택 잠금', [lock.본문,lock.안내,lock.라벨].every(v=>v==='none'),
     `body/안내/라벨 = ${lock.본문}/${lock.안내}/${lock.라벨}`);
  ok('화면 확대 잠금', /maximum-scale=1/.test(lock.메타)&&/user-scalable=no/.test(lock.메타)
     &&/pan-x/.test(lock.터치)&&/pan-y/.test(lock.터치)&&!/pinch/.test(lock.터치),
     `touch-action=${lock.터치} · ${/maximum-scale=1/.test(lock.메타)?'maximum-scale=1':'없음'}`);

  // 2-c) 상대가 낸 카드 공개 = 평소 카드를 크게 (전용 마크업 아님)
  const rv=await p.evaluate(async()=>{
    const nm=Object.keys(POOL).find(x=>POOL[x].k==='cr');
    S.reveal={side:'ai',name:nm}; render();
    const c=document.querySelector('.reveal .tcard');
    /* ⚠ getBoundingClientRect 는 안 된다 — 공개 연출은 rotateY 로 뒤집히며 들어와서
       애니메이션 중에 재면 폭이 0 에 가깝게 나온다. offsetWidth 는 transform 을 안 탄다. */
    showZoom(nm,null,null,false);
    const ze=document.querySelector('#zoom .tcard');
    const zw=ze?ze.offsetWidth:0;
    hideZoom(); lpFired=false;
    const old=!!document.querySelector('.reveal .rcard');
    const w=c?c.offsetWidth:0;
    S.reveal=null; render();
    return {있음:!!c, 클래스:c?c.className:'', 폭:w, 확대폭:zw, 옛마크업:old};});
  ok('공개 카드 = 같은 규격', rv.있음&&/\blg\b/.test(rv.클래스)&&!rv.옛마크업
     &&Math.abs(rv.폭-rv.확대폭)<2,
     `.tcard.lg ${rv.폭}px · 확대 UI ${rv.확대폭}px · 전용 .rcard ${rv.옛마크업?'남아있음':'없음'}`);

  // 3) 설치 안내가 서랍에 뜬다
  await p.click('#gearBtn'); await p.waitForTimeout(350);
  ok('설치 안내', (await p.$eval('#installHow',e=>e.textContent)).length>10,
     '"'+(await p.$eval('#installHow',e=>e.textContent)).slice(0,26)+'…"');
  await p.evaluate(()=>document.body.classList.remove('sideon')); await p.waitForTimeout(300);

  // 4) 대상 지정 — 판으로 나가고, 고를 수 있는 것만 빛나고, 빈 곳을 누르면 손으로 돌아온다
  await p.evaluate(()=>{
    S.me.lands=[]; for(let i=0;i<8;i++){S.me.landPlayed=false;playLand('me','화산');}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&!POOL[n].over);
    S.ai.board=[]; placeCreature('ai',cr[0]); placeCreature('ai',cr[1]);
    S.me.board=[]; placeCreature('me',cr[2]);
    while(S.me.hand.length<7)draw('me');
    const sp=Object.keys(POOL).find(n=>POOL[n].k==='sp'&&POOL[n].el==='fire'&&POOL[n].c<=3
      &&!INSTANT.includes(POOL[n].mode)&&POOL[n].mode!=='summon'&&!NEEDS_MINE.includes(POOL[n].mode));
    S.me.hand[S.me.hand.length-1]=sp; window.__sp=sp; render();});
  await p.waitForTimeout(300);
  const hand0=await p.evaluate(()=>S.me.hand.length);
  const el=await p.$('#hand .hcw:last-child'); const bx=await el.boundingBox();
  const bd=await (await p.$('#myBoard')).boundingBox();
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2); await p.mouse.down();
  await p.mouse.move(bx.x+bx.width/2,bx.y-60,{steps:4});
  await p.mouse.move(bd.x+bd.width/2,bd.y-30,{steps:6}); await p.mouse.up(); await p.waitForTimeout(350);
  const st=await p.evaluate(()=>{
    const c=document.querySelector('.tgtcard'); const r=c?c.getBoundingClientRect():null;
    const b=document.getElementById('myBoard').getBoundingClientRect();
    return {on:!!TGT, 판위:r?Math.abs((r.top+r.bottom)/2-(b.top+b.height/2))<b.height:false,
      빛나는대상:document.querySelectorAll('#foeBoard .slot.pick').length,
      어두운것:document.querySelectorAll('#myBoard .slot:not(.pick)').length,
      /* 화면 전체를 덮는 딤이 떠 있고, 고를 수 있는 슬롯만 그 위로 올라와 있어야 한다.
         elementFromPoint 로 실제 픽셀을 짚어 본다 — z-index 값만 봐서는 쌓임 맥락에 갇혔는지 모른다.
         ⚠ 딤은 pointer-events:none 이라 그대로는 elementFromPoint 에 안 잡힌다 — 재는 동안만 켠다. */
      딤:(()=>{const d=document.getElementById('tgtdim');
        window.__dimOn=getComputedStyle(d).display!=='none'; d.style.pointerEvents='auto';
        return window.__dimOn;})(),
      위로:[...document.querySelectorAll('#foeBoard .slot.pick')].every(s=>{
        const r=s.getBoundingClientRect();
        const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return !!e&&(s===e||s.contains(e));}),
      덮임:[...document.querySelectorAll('#myBoard .slot.occ:not(.pick)')].map(s=>{
        const r=s.getBoundingClientRect();
        const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return e?(e.id||e.className||e.tagName):'null';})};});
  await p.evaluate(()=>{const d=document.getElementById('tgtdim');d.style.pointerEvents='';});
  ok('판으로 나가 대상 지정', st.on&&st.판위&&st.빛나는대상===2,
     `카드가 판 위 ${st.판위} · 빛나는 대상 ${st.빛나는대상}종`);
  ok('딤이 화면을 덮는다', st.딤&&st.위로&&st.덮임.every(x=>x==='tgtdim'),
     `딤 ${st.딤} · 대상은 딤 위 ${st.위로} · 나머지 ${JSON.stringify(st.덮임)}`);
  // 빈 곳 탭 → 손으로
  await p.mouse.click(8,Math.round(bd.y-8)); await p.waitForTimeout(350);
  ok('빈 곳 누르면 손으로', !(await p.evaluate(()=>!!TGT))&&await p.evaluate(()=>S.me.hand.length)===hand0,
     `타게팅 해제 · 손패 ${hand0} 유지`);
  // 대상 탭 → 발동
  await p.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2); await p.mouse.down();
  await p.mouse.move(bx.x+bx.width/2,bx.y-60,{steps:4});
  await p.mouse.move(bd.x+bd.width/2,bd.y-30,{steps:6}); await p.mouse.up(); await p.waitForTimeout(300);
  const t=await p.$('#foeBoard .slot.pick'); const tb=await t.boundingBox();
  await p.mouse.click(tb.x+tb.width/2,tb.y+tb.height/2); await p.waitForTimeout(600);
  ok('대상 누르면 발동', !(await p.evaluate(()=>!!TGT))&&await p.evaluate(()=>S.me.hand.length)===hand0-1,
     `손패 ${hand0} → ${await p.evaluate(()=>S.me.hand.length)}`);
  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
