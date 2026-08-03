/* 카드 뷰어(cards/index.html) 검사 — 덱별 묶음 · 원정 적 덱(난이도 3단계) · 필터 · 검색 · 확대 ·
 * 그리고 무엇보다 **게임과 카드 규격이 같은가**
 *   node tools/test_cards.js */
const path=require('path'), fs=require('fs'), cp=require('child_process');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const VIEW='file://'+path.join(ROOT,'cards','index.html');
const PROTO='file://'+path.join(ROOT,'prototype','index.html');
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };

  /* 0) 빌드가 최신인가 — 프로토타입을 고치고 다시 뽑지 않으면 규격이 갈린다 */
  const before=fs.readFileSync(path.join(ROOT,'cards','index.html'),'utf8');
  cp.execFileSync('python3',[path.join(ROOT,'tools','build_cards_page.py')]);
  const after=fs.readFileSync(path.join(ROOT,'cards','index.html'),'utf8');
  ok('빌드 최신', before===after, before===after?'다시 뽑아도 그대로'
     :'프로토타입이 바뀐 뒤 build_cards_page.py 를 안 돌렸다');

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(VIEW); await p.waitForTimeout(800);

  // 1) 덱별로 묶여 있고, 각 덱이 40장이다
  const secs=await p.evaluate(()=>[...document.querySelectorAll('.dsec')].map(s=>({
    제목:s.querySelector('h2 .ko').textContent,
    수:s.querySelector('h2 .cnt').textContent,
    셀:s.querySelectorAll('.cell').length})));
  ok('덱 7종으로 묶임', secs.length===7&&secs.every(s=>/40장$/.test(s.수)),
     secs.map(s=>`${s.제목}(${s.셀})`).join(' '));

  // 2) 카드가 게임 규격(5:7)으로 그려진다
  const sz=await p.evaluate(()=>{
    const t=document.querySelector('.cell .tcard').getBoundingClientRect();
    const cw=parseFloat(getComputedStyle(document.querySelector('.cell')).width);
    return {w:Math.round(t.width),h:Math.round(t.height),cw:Math.round(cw)};});
  ok('카드 규격 5:7', Math.abs(sz.h/sz.w-1.4)<0.02&&Math.abs(sz.w-sz.cw)<2,
     `${sz.w}×${sz.h} (비율 ${(sz.h/sz.w).toFixed(2)})`);

  // 3) 지형이 먼저, 그 다음 코스트 순
  const order=await p.evaluate(()=>[...document.querySelectorAll('.dsec')[0]
    .querySelectorAll('.cell')].map(e=>e.dataset.n));
  const costs=await p.evaluate(ns=>ns.map(n=>LANDS[n]?-1:POOL[n].c),order);
  ok('지형 먼저 · 코스트 순', costs[0]===-1&&costs.slice(1).every((c,i)=>c>=costs[i+1-1+1-1]||true)
     &&costs.slice(1).every((c,i,a)=>i===0||a[i-1]<=c),
     costs.join(','));

  // 4) 속성 · 종류 필터
  await p.click('#elBar .chip[data-el="dark"]'); await p.waitForTimeout(250);
  const only=await p.evaluate(()=>document.querySelectorAll('.dsec').length);
  await p.click('#kBar .chip[data-k="sp"]'); await p.waitForTimeout(250);
  const sp=await p.evaluate(()=>[...document.querySelectorAll('.cell')].every(e=>POOL[e.dataset.n].k==='sp'));
  const spn=await p.evaluate(()=>document.querySelectorAll('.cell').length);
  ok('속성·종류 필터', only===1&&sp&&spn>0, `어둠 1덱 · 스펠만 ${spn}종`);

  // 5) 검색
  await p.click('#elBar .chip[data-el="all"]'); await p.click('#kBar .chip[data-k="all"]');
  await p.fill('#q','가호'); await p.waitForTimeout(300);
  const found=await p.evaluate(()=>[...document.querySelectorAll('.cell')].map(e=>e.dataset.n));
  ok('검색', found.length>=3&&found.includes('수호천사'), found.join(', '));
  await p.fill('#q',''); await p.waitForTimeout(250);

  // 6) 확대 — 게임의 확대와 같은 lg 규격 + 용어 설명
  await p.click('.dsec:nth-child(2) .cell:nth-child(3)').catch(()=>{});
  await p.evaluate(()=>{const c=[...document.querySelectorAll('.cell')]
    .find(e=>POOL[e.dataset.n]&&(POOL[e.dataset.n].kw||'').length>2); c&&c.click();});
  await p.waitForTimeout(400);
  const z=await p.evaluate(()=>{const zz=document.getElementById('zoom');
    const c=zz.querySelector('.tcard');
    return {on:zz.classList.contains('on'), lg:c?/\blg\b/.test(c.className):false,
      w:c?Math.round(c.getBoundingClientRect().width):0, def:zz.querySelectorAll('.zdef').length};});
  ok('확대 = lg 규격', z.on&&z.lg&&z.w>200&&z.def>0, `${z.w}px · 용어 ${z.def}개`);
  await p.click('#zoom'); await p.waitForTimeout(250);
  ok('아무 곳이나 눌러 닫기', !(await p.evaluate(()=>document.getElementById('zoom').classList.contains('on'))), '');

  // 7) ★ 게임과 카드 마크업이 **완전히 같은가** — 뷰어용으로 따로 그리지 않는다는 보증
  const names=await p.evaluate(()=>Object.keys(POOL).slice(0,40).concat(Object.keys(LANDS).slice(0,4)));
  const vHtml=await p.evaluate(ns=>ns.map(n=>LANDS[n]?landCardHTML(n,'md'):tcardHTML(n,{size:'md'})),names);
  const g=await b.newPage({viewport:{width:1020,height:1300}});
  await g.goto(PROTO+'?dev=1'); await g.waitForTimeout(700);
  const gHtml=await g.evaluate(ns=>ns.map(n=>LANDS[n]?landCardHTML(n,'md'):tcardHTML(n,{size:'md'})),names);
  const diff=names.filter((n,i)=>vHtml[i]!==gHtml[i]);
  ok('게임과 마크업 동일', diff.length===0,
     diff.length?`어긋난 카드: ${diff.slice(0,4).join(', ')}`:`${names.length}종 대조 일치`);

  // 8) 원정 적 덱 — 난이도 단계별로 볼 수 있는가
  await p.click('#tabFoe'); await p.waitForTimeout(400);
  const f0=await p.evaluate(()=>({
    적:document.querySelectorAll('.foe').length,
    난이도:[...document.querySelectorAll('#bandBar .chip')].length,
    등급:[...document.querySelectorAll('#kBar .chip')].map(e=>e.textContent.trim()),
    첫통계:document.querySelector('.foestat').textContent.replace(/\s+/g,' ').trim()}));
  ok('적 35명 · 3단계', f0.적===35&&f0.난이도===3&&f0.등급.join()==='전체,일반,정예,보스',
     `${f0.적}명 · 난이도 ${f0.난이도}단계`);
  ok('1단계 통계', /HP 20~23/.test(f0.첫통계)&&/덱 40장/.test(f0.첫통계), f0.첫통계);
  /* 단계를 올리면 체력과 강화 카드가 늘어야 한다 — 이게 '난이도별'의 실체다 */
  await p.click('#bandBar .chip[data-b="2"]'); await p.waitForTimeout(350);
  const f2=await p.evaluate(()=>document.querySelector('.foestat').textContent.replace(/\s+/g,' ').trim());
  ok('3단계는 더 강하다', /HP 3\d~3\d/.test(f2)&&/강화/.test(f2), f2);
  // 등급 필터 · 보스 체력
  await p.click('#kBar .chip[data-k="boss"]'); await p.waitForTimeout(350);
  const bs=await p.evaluate(()=>({수:document.querySelectorAll('.foe').length,
    통계:document.querySelector('.foestat').textContent.replace(/\s+/g,' ').trim()}));
  ok('보스 7명', bs.수===7&&/HP 7\d~\d+/.test(bs.통계), `${bs.수}명 · ${bs.통계}`);
  /* 강화 카드가 회색이 아니라 제 속성 색으로 그려지는가 (CE 에 없어서 steel 로 떨어지던 버그) */
  const ov=await p.evaluate(()=>{
    const c=[...document.querySelectorAll('.cell')].find(e=>/^강화/.test(e.dataset.n));
    if(!c)return null;
    const t=c.querySelector('.tcard');
    return {n:c.dataset.n, el:getComputedStyle(t).getPropertyValue('--el').trim(),
      art:!!t.querySelector('.tart').style.backgroundImage};});
  ok('강화 카드도 제 속성 색', ov&&ov.el.toLowerCase()!=='#8894a6',
     ov?`${ov.n} → ${ov.el}${ov.art?' · 원본 일러스트 차용':''}`:'강화 카드 없음');
  await p.click('#tabCard'); await p.waitForTimeout(300);
  ok('카드 탭으로 복귀', (await p.evaluate(()=>document.querySelectorAll('.dsec').length))===7, '');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
