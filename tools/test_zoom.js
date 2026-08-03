/* 카드 확대 동작 — 롱프레스로 뜨는가 · **팝업으로 남는가** · 아무 데나 눌러 닫히는가 ·
 * 용어 설명이 카드를 안 덮는가 · 겹침 순서가 유지되는가
 *   node tools/test_zoom.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
const b=await chromium.launch(); let bad=0;
const ok=(k,pass,d)=>{ if(!pass)bad++; console.log((pass?'✅':'❌')+' '+k.padEnd(22),d); };
for(const [w,h,tag] of [[390,844,'모바일'],[1020,1300,'데스크톱']]){
  console.log(`\n── ${tag} ${w}×${h}`);
  const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:w<800,hasTouch:true});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(FILE+'?dev=1');await p.waitForTimeout(600);
  await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
  await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(250);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
  await p.evaluate(()=>{
    while(S.me.lands.length<4){S.me.landPlayed=false;const j=S.me.hand.findIndex(isLand);
      if(j<0)break;playLand('me',S.me.hand[j]);S.me.hand.splice(j,1);}
    S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
    while(S.me.hand.length<7)draw('me');
    const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire'&&POOL[n].c<=2);
    if(cr[0])S.me.hand[S.me.hand.length-1]=cr[0];
    placeCreature('me',cr[0]||'불씨정령',0); render();});
  await p.waitForTimeout(300);
  const zbefore=await p.evaluate(()=>[...document.getElementById('hand').children].map(c=>+c.style.zIndex));
  /* 가운데 카드로 검사한다 — 맨 오른쪽 카드는 원래 맨 위라 겹침이 흐트러져도 드러나지 않는다 */
  const mid=await p.evaluate(()=>Math.floor(document.getElementById('hand').children.length/2));
  const midEl=await p.$(`#hand .hcw:nth-child(${mid+1})`);
  const r0=await midEl.boundingBox();
  const el=await p.$('#hand .hcw:last-child'); const bx=await el.boundingBox();
  const cx=bx.x+bx.width/2, cy=bx.y+bx.height/2;

  // 1) 손패도 롱프레스(420ms) — 짧게 눌러선 안 뜨고 길게 누르면 뜬다
  await p.mouse.move(cx,cy); await p.mouse.down(); await p.waitForTimeout(120);
  const hEarly=await p.$eval('#zoom',e=>e.classList.contains('on'));
  await p.waitForTimeout(450);
  const hLate=await p.$eval('#zoom',e=>e.classList.contains('on'));
  ok('손패 롱프레스 확대', !hEarly&&hLate, `120ms ${hEarly} · 570ms ${hLate}`);
  // 2) 누르는 동안 레이어가 바뀌지 않는다
  const zdur=await p.evaluate(()=>[...document.getElementById('hand').children].map(c=>+c.style.zIndex));
  const zsame=JSON.stringify(zbefore)===JSON.stringify(zdur);
  const comp=await p.evaluate(()=>{const c=document.querySelector('.hcw.zoomed');
    return c?getComputedStyle(c).zIndex:'none';});
  ok('레이어 그대로', zsame&&comp===String(zbefore[zbefore.length-1]),
     `${zbefore.join(',')} → ${zdur.join(',')} · 눌린 카드 계산값 ${comp}`);
  // 3) 원본 강조는 유지
  ok('원본 강조', await p.evaluate(()=>!!document.querySelector('.hcw.zoomed')), '.zoomed 부착');
  // 3-b) 가운데 카드를 눌러도 자리·크기가 그대로여야 한다
  await p.mouse.up(); await p.waitForTimeout(200);
  await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;render();}); await p.waitForTimeout(250);
  const rm0=await (await p.$(`#hand .hcw:nth-child(${mid+1})`)).boundingBox();
  /* ⚠ 세로 위치는 카드 높이의 절반 안쪽으로. 손패는 70%만 드러나 있어서
     0.7 지점은 화면 밖(뷰포트 아래)으로 나가 아무것도 안 눌린다. */
  await p.mouse.move(rm0.x+10,rm0.y+rm0.height*0.42); await p.mouse.down(); await p.waitForTimeout(560);
  const rm1=await (await p.$(`#hand .hcw:nth-child(${mid+1})`)).boundingBox();
  const same=['x','y','width','height'].every(k=>Math.abs(rm0[k]-rm1[k])<0.6);
  ok('눌러도 제자리', same, `${Math.round(rm0.x)},${Math.round(rm0.y)},${Math.round(rm0.width)}`
    +` → ${Math.round(rm1[ 'x'])},${Math.round(rm1.y)},${Math.round(rm1.width)}`);
  // 4) 손을 떼도 닫히지 않는다 — 팝업이라 읽을 시간이 있어야 한다
  await p.mouse.up(); await p.waitForTimeout(250);
  const stay=await p.$eval('#zoom',e=>e.classList.contains('on'));
  ok('떼도 안 닫힘(팝업)', stay, '');
  // 4-b) 화면 아무 곳이나 누르면 닫힌다
  await p.mouse.click(Math.round(w*0.5),Math.round(h*0.06)); await p.waitForTimeout(250);
  ok('아무 곳이나 눌러 닫기', !(await p.$eval('#zoom',e=>e.classList.contains('on'))),
     `(${Math.round(w*0.5)},${Math.round(h*0.06)}) 탭`);
  // 4-c) 용어 설명은 카드 **아래**에 놓이고 겹치지 않는다
  const gl=await p.evaluate(async()=>{
    let best=null,bn=0;
    for(const n of Object.keys(POOL)){const c=POOL[n];let k=0;
      if(c.g)k++;if(c.f)k++;if(c.p)k++;if(c.kw)k+=c.kw.split('·').length;
      if(k>bn&&k<=3){bn=k;best=n;}}
    showZoom(best,null,null,false);
    await new Promise(r=>setTimeout(r,600));
    const card=document.querySelector('#zoom .tcard').getBoundingClientRect();
    const side=document.querySelector('#zoom .zside');
    const sr=side.getBoundingClientRect();
    const 상자=[...side.children].map(x=>Math.round(x.getBoundingClientRect().bottom));
    hideZoom(); lpFired=false;
    return {카드:best, 태그:side.children.length,
      아래:Math.round(sr.top-card.bottom), 옆:Math.round(sr.left-card.right),
      마지막바닥:상자[상자.length-1], 화면:innerHeight};});
  /* 모바일(세로)에서는 카드 **아래**, 데스크톱(가로)에서는 **옆**.
     둘 다 겹치면 안 된다 — 예전에는 모바일에서 화면 하단에 고정돼 카드를 덮었다. */
  const 안겹침 = w<900 ? gl.아래>=0 : (gl.옆>=0||gl.아래>=0);
  ok(w<900?'용어는 카드 아래':'용어는 카드 옆', 안겹침&&gl.태그>=2&&gl.마지막바닥<=gl.화면,
     `${gl.카드} 태그 ${gl.태그}개 · 아래 ${gl.아래}px / 옆 ${gl.옆}px · 마지막 상자 ${gl.마지막바닥}/${gl.화면}`);
  await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;render();}); await p.waitForTimeout(200);
  // 5) 짧게 탭해도 아무 일도 없다 — 카드는 끌어야만 나간다
  await p.evaluate(()=>{hideZoom();lpFired=false;S.sel=null;S.mode=null;render();}); await p.waitForTimeout(200);
  const bd0=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  const el2=await p.$('#hand .hcw:last-child'); const b2=await el2.boundingBox();
  await p.mouse.move(b2.x+b2.width/2,b2.y+b2.height/2);
  await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(250);
  const bd1=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  ok('짧은 탭 = 무동작', await p.evaluate(()=>S.sel)===null&&bd0===bd1,
     `sel=${await p.evaluate(()=>S.sel)} · 보드 ${bd0}→${bd1}`);
  await p.evaluate(()=>{S.sel=null;S.mode=null;render();}); await p.waitForTimeout(200);
  // 6) 확대 중에 끌면 드래그로 이어진다
  const before=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  const el3=await p.$('#hand .hcw:last-child'); const b3=await el3.boundingBox();
  const board=await (await p.$('#myBoard')).boundingBox();
  await p.mouse.move(b3.x+b3.width/2,b3.y+b3.height/2); await p.mouse.down(); await p.waitForTimeout(560);
  await p.mouse.move(b3.x+b3.width/2,b3.y-50,{steps:5});
  const gone=await p.$eval('#zoom',e=>!e.classList.contains('on'));
  await p.mouse.move(board.x+board.width/2,board.y+board.height/2,{steps:6});
  await p.mouse.up(); await p.waitForTimeout(450);
  const after=await p.evaluate(()=>S.me.board.filter(x=>x).length);
  ok('확대 뒤 끌기 = 소환', gone&&after>before, `확대 접힘 ${gone} · 보드 ${before}→${after}`);
  // 7) 보드 카드는 여전히 길게 눌러야 (짧게는 안 뜬다)
  const sl=await p.$('#myBoard .slot.occ'); const b4=await sl.boundingBox();
  await p.mouse.move(b4.x+b4.width/2,b4.y+b4.height/2); await p.mouse.down(); await p.waitForTimeout(120);
  const early=await p.$eval('#zoom',e=>e.classList.contains('on'));
  await p.waitForTimeout(450);
  const late=await p.$eval('#zoom',e=>e.classList.contains('on'));
  await p.mouse.up(); await p.evaluate(()=>{hideZoom();lpFired=false;});
  ok('보드는 롱프레스 유지', !early&&late, `120ms ${early} · 570ms ${late}`);
  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  await p.close();
}
console.log(bad?`\n❌ ${bad}건 실패`:'\n✅ 전부 통과');
await b.close(); process.exit(bad?1:0);})();
