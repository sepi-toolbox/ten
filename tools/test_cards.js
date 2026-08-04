/* 카드 뷰어(cards/index.html) 검사 — 덱별 묶음 · 원정 적 덱(난이도 3단계) · 필터 · 검색 · 확대 ·
 * 앱(PWA) 설치 · 그리고 무엇보다 **게임과 카드 규격이 같은가**
 *   node tools/test_cards.js */
const path=require('path'), fs=require('fs'), cp=require('child_process'), http=require('http');
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
  const DECKS_JSON=JSON.parse(require('fs').readFileSync(
    path.join(__dirname,'..','data','decks.json'),'utf8'));

  /* 1) 덱별로 묶여 있고, 각 덱이 40장이다.
     ⚠ 셀 수는 **덱 장수와 다를 수 있다** — gen_decks 의 매수 0(덱 미수록) 카드도 그 속성 칸에
        같이 보여 주기 때문이다. 검사는 헤더의 '… 40장' 문구로 한다. */
  const secs=await p.evaluate(()=>[...document.querySelectorAll('.dsec')].map(s=>({
    제목:s.querySelector('h2 .ko').textContent,
    수:s.querySelector('h2 .cnt').textContent,
    셀:s.querySelectorAll('.cell').length})));
  /* ⚠ '종' 수를 **박아 두지 않는다.** 지형 종류 + 카드 종류인데, 기본 지형이 여러 종인 속성이
     생기면서(불·물 = 3종) 21 이 아니게 됐다. data/decks.json 에서 그때그때 계산한다 —
     숫자를 박으면 카드를 손댈 때마다 이 검사가 애먼 이유로 빨간불이 된다. */
  const want=Object.values(DECKS_JSON).map(d=>d.lands.length+d.cards.length);
  const bad7=secs.filter((s,i)=>!new RegExp(`${want[i]}종 · 40장`).test(s.수));
  ok('덱 7종으로 묶임', secs.length===7&&bad7.length===0,
     secs.map((s,i)=>`${s.제목} ${s.수.trim()}(기대 ${want[i]}종)`).join(' · '));

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
  /* 단계를 올리면 체력이 오르고, **자동 생성 덱**에는 강화 카드가 섞인다.
     ⚠ 고정 덱(FIXED)은 강화 치환을 안 받는다 — 대신 단계마다 새 카드가 들어간다.
        첫 적이 마침 고정 덱(사나운 고블린)이라, 강화 여부는 고정이 아닌 적에서 본다. */
  await p.click('#bandBar .chip[data-b="2"]'); await p.waitForTimeout(350);
  const f2=await p.evaluate(()=>{
    const all=[...document.querySelectorAll('.foestat')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
    /* 고정 덱이 몇 명인지는 **데이터에서 센다** — 손으로 적어 두면 적을 추가할 때마다 어긋난다 */
    return {첫:all[0], 강화:all.filter(t=>/강화/.test(t)).length, 수:all.length,
            고정:FOES.filter(e=>e.fixed).length};});
  ok('3단계는 더 강하다', /HP 3\d~3\d/.test(f2.첫)&&f2.강화===f2.수-f2.고정,
     `${f2.첫} · 강화 카드를 든 적 ${f2.강화}/${f2.수}명 (고정 덱 ${f2.고정}명은 새 카드로 대신한다)`);
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
  /* 주력 카드(적 조우 화면의 그 넷)가 맨 앞에 오는가 — 게임의 정의와 대조한다 */
  await p.click('#kBar .chip[data-k="all"]'); await p.click('#bandBar .chip[data-b="0"]');
  await p.waitForTimeout(350);
  const core=await p.evaluate(()=>{const f=document.querySelector('.foe');
    const cs=[...f.querySelectorAll('.cell')];
    return {적:f.querySelector('.nm').textContent,
      앞4:cs.slice(0,4).map(e=>e.dataset.n),
      표:cs.map((e,i)=>e.classList.contains('core')?i:-1).filter(i=>i>=0)};});
  const gcore=await g.evaluate(()=>{const e=FOES[0], d=e.decks[0];
    return d.slice().sort((a,b)=>((POOL[b[0]]||{}).c||0)-((POOL[a[0]]||{}).c||0)
      ||a[0].localeCompare(b[0])).slice(0,4).map(x=>x[0]);});
  ok('주력 카드가 맨 앞', core.앞4.join()===gcore.join()&&core.표.join()==='0,1,2,3',
     `${core.적}: ${core.앞4.join(' · ')} (게임과 일치)`);

  await p.click('#tabCard'); await p.waitForTimeout(300);
  ok('카드 탭으로 복귀', (await p.evaluate(()=>document.querySelectorAll('.dsec').length))===7, '');

  /* 8-b) 효과 태그 필터 — 목록의 정본은 GLOSSARY 다. 뷰어가 따로 적어 두면 반드시 어긋난다. */
  const tg=await p.evaluate(()=>({
    칩:TAGS.map(t=>t.k),
    정본:Object.keys(GLOSSARY),
    설명일치:TAGS.every(t=>!GLOSSARY[t.k]||GLOSSARY[t.k][1]===t.desc),
    합:TAGS.filter(t=>t.k!=='없음').reduce((s,t)=>s+t.n,0),
    크리처:CRN}));
  ok('태그 목록 = 용어집', tg.칩.filter(k=>tg.정본.includes(k)).every((k,i,a)=>
        tg.정본.indexOf(k)>(i?tg.정본.indexOf(a[i-1]):-1)) && tg.설명일치,
     `${tg.칩.length}종 — ${tg.칩.join(' · ')}`);
  for(const [t,chk] of [['비행',n=>POOL[n].f],['제물',n=>/제물/.test(POOL[n].kw||'')],
                        /* '고유' = kw 의 머리 낱말이 용어집에 없는 것. 뷰어와 **같은 판정**을 쓴다
                           — 예전엔 여기에 /(소환|소멸) 시/ 라고 따로 적어 뒀는데, 그 틀에서
                           벗어난 고유 효과("내가 스펠을 쓸 때마다 …")가 생기자마자 어긋났다. */
                        ['고유',n=>(POOL[n].kw||'').split('·').map(s=>s.trim())
                          .filter(s=>s&&s!=='—').some(s=>!GLOSSARY[s.split(/[\s+]/)[0]])],
                        ['없음',n=>!(POOL[n].kw||'').replace(/[—\s]/g,'')&&!POOL[n].g&&!POOL[n].f&&!POOL[n].p]]){
    await p.click(`#tagBar .chip[data-t="${t}"]`); await p.waitForTimeout(250);
    const r=await p.evaluate(k=>{
      const cs=[...document.querySelectorAll('.cell')].map(e=>e.dataset.n);
      return {수:cs.length, 크리처만:cs.every(n=>(POOL[n]||{}).k==='cr'),
        기대:TAGS.find(x=>x.k===k).n,
        설명:document.getElementById('tagDesc').classList.contains('on'), 예:cs.slice(0,3)};},t);
    ok(`태그 필터 · ${t}`, r.수===r.기대&&r.크리처만&&r.설명&&
       await p.evaluate(c=>[...document.querySelectorAll('.cell')].every(e=>eval(c)(e.dataset.n)),chk.toString()),
       `${r.수}종 (${r.예.join(' · ')}…)`);
  }
  await p.click('#tagBar .chip[data-t="all"]'); await p.waitForTimeout(250);

  /* 8-c) 카드 뽑아보기 — 그 덱을 실제로 40장 쌓아 시작 손패를 돌린다.
     ⚠ 손패 매수·뽑기 보정은 **게임과 같아야** 한다. 갈리면 이 화면이 거짓말을 한다. */
  await p.click('.drawbtn[data-el="fire"]'); await p.waitForTimeout(600);
  const dr=await p.evaluate(()=>{
    const d=document.getElementById('draw');
    const names=[...d.querySelectorAll('.dhand .tcard .tname')].map(e=>e.textContent);
    return {on:d.classList.contains('on'), n:names.length,
      lands:names.filter(x=>LANDS[x]).length, all:names.every(x=>POOL[x]||LANDS[x]),
      tot:DRAW.list.reduce((s,[,c])=>s+c,0), stat:!!DRAW.st};});
  ok('뽑아보기 = 7장', dr.on&&dr.n===7&&dr.all&&dr.tot===40,
     `덱 ${dr.tot}장에서 ${dr.n}장 · 지형 ${dr.lands}`);
  ok('뽑기 보정이 걸린다', dr.lands>=1&&dr.stat,
     '지형이 최소 1장(게임의 fixLand 와 같은 규칙) · 2000회 통계도 함께');
  const again=await p.evaluate(async()=>{
    const before=[...document.querySelectorAll('.dhand .tcard .tname')].map(e=>e.textContent).join();
    let diff=false;
    for(let i=0;i<8&&!diff;i++){ document.getElementById('dAgain').click();
      diff=[...document.querySelectorAll('.dhand .tcard .tname')].map(e=>e.textContent).join()!==before; }
    return diff;});
  ok('다시 뽑기', again, '누를 때마다 새로 섞는다');
  await p.click('#dClose'); await p.waitForTimeout(250);
  ok('뽑아보기 닫힘', !(await p.evaluate(()=>document.getElementById('draw').classList.contains('on'))), '');

  // 9) 앱(PWA) — 게임과 **별개의 앱**으로 깔리고, 서로의 오프라인 캐시를 지우지 않는다
  const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.png':'image/png',
    '.webmanifest':'application/manifest+json','.json':'application/json'};
  const srv=http.createServer((q,r)=>{
    let f=decodeURIComponent(q.url.split('?')[0]); if(f.endsWith('/'))f+='index.html';
    const fp=path.join(ROOT,f);
    if(!fs.existsSync(fp)){r.writeHead(404);return r.end('');}
    r.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});
    r.end(fs.readFileSync(fp));});
  await new Promise(res=>srv.listen(8733,res));
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const w=await ctx.newPage();
  await w.goto('http://localhost:8733/cards/'); await w.waitForTimeout(1800);
  const pwa=await w.evaluate(async()=>{
    const man=await (await fetch(document.querySelector('link[rel=manifest]').href)).json();
    const reg=await navigator.serviceWorker.getRegistration();
    return {name:man.name, disp:man.display, icons:man.icons.length,
      apple:!!document.querySelector('meta[name="apple-mobile-web-app-capable"]'),
      scope:reg?reg.scope:null};});
  ok('뷰어도 앱으로 깔린다', pwa.disp==='standalone'&&pwa.icons>=3&&pwa.apple
     &&/\/cards\/$/.test(pwa.scope||''), `${pwa.name} · scope ${pwa.scope}`);
  /* 아이콘이 게임과 달라야 홈 화면에서 구분된다 */
  const ic=fs.readFileSync(path.join(ROOT,'cards','icon-512.png'));
  const gi=fs.readFileSync(path.join(ROOT,'prototype','icon-512.png'));
  ok('아이콘이 게임과 다르다', !ic.equals(gi), `뷰어 ${(ic.length/1024|0)}KB · 게임 ${(gi.length/1024|0)}KB`);
  /* ⚠ 서비스워커 scope 는 달라도 캐시 저장소는 출처 하나를 공유한다.
     게임 SW 가 옛 캐시를 지울 때 접두사를 안 보면 뷰어 캐시까지 날린다(실제로 그랬다). */
  await w.goto('http://localhost:8733/prototype/'); await w.waitForTimeout(2200);
  const keys=await w.evaluate(()=>caches.keys());
  ok('게임을 열어도 뷰어 캐시 유지', keys.some(k=>k.startsWith('ten-cards-'))
     &&keys.some(k=>k.startsWith('ten-v')), keys.join(' · '));
  await w.goto('http://localhost:8733/cards/'); await w.waitForTimeout(1200);
  await ctx.setOffline(true); await w.reload().catch(()=>{}); await w.waitForTimeout(800);
  const off=await w.evaluate(()=>document.querySelectorAll('.cell').length);
  ok('오프라인에서도 열린다', off>100, `카드 ${off}종`);
  await ctx.setOffline(false); await ctx.close(); srv.close();

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
