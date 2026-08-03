/* 희귀도 — 데이터 · 카드 표시 · 뷰어 필터 · 보상 가중치 · 적 덱 구성
 *   node tools/test_rarity.js
 * (예산 배수 검산은 파이썬 쪽 tools/validate_budget.py 의 [1-b] 가 본다) */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const PROTO='file://'+path.join(ROOT,'prototype','index.html');
const VIEW='file://'+path.join(ROOT,'cards','index.html');
const RARS=['common','uncommon','rare','legendary'];
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

  // 1) 데이터 — 네 등급이 모두 존재하고 POOL·rogue 양쪽에 실려 있다
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const cnt={}; RARS.forEach(r=>cnt[r]=0);
  Object.values(pool).forEach(c=>cnt[c.r||'common']++);
  ok('네 등급 모두 존재', RARS.every(r=>cnt[r]>0),
     RARS.map(r=>`${r} ${cnt[r]}`).join(' · '));
  const rogue=JSON.parse(fs.readFileSync(path.join(ROOT,'data','rogue.json'),'utf8'));
  ok('강화 카드도 희귀도 상속', Object.values(rogue.over).every(c=>!!c.r)
     && rogue.over['강화 겁화룡'].r===(pool['겁화룡'].r||'common'),
     `강화 겁화룡 = ${rogue.over['강화 겁화룡'].r}`);
  ok('보상 가중치 데이터', !!(rogue.config.rarityWeights&&rogue.config.rarityWeights.elite),
     JSON.stringify(rogue.config.rarityWeights.elite));

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1020,height:1300}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(PROTO+'?dev=1'); await p.waitForTimeout(800);

  // 2) 카드에 희귀도 보석이 붙는다 — 어느 규격에서나 --cw 비례
  const gem=await p.evaluate(()=>{
    const leg=Object.keys(POOL).find(n=>POOL[n].r==='legendary');
    const d=document.createElement('div');
    d.innerHTML=tcardHTML(leg,{size:'md'})+tcardHTML(Object.keys(POOL).find(n=>!POOL[n].r),{size:'md'});
    document.body.appendChild(d);
    const gs=[...d.querySelectorAll('.rgem')];
    const t=d.querySelector('.tcard');
    /* ⚠ 보석은 45° 회전이라 getBoundingClientRect 는 √2 배로 부푼 상자를 준다 —
       offsetWidth 로 재야 실제 변 길이가 나온다(공개 카드 검사에서도 같은 함정을 밟았다). */
    const r={leg, 개수:gs.length, 클래스:gs.map(g=>g.className.replace('rgem ','')),
      비율:+(gs[0].offsetWidth/t.offsetWidth).toFixed(3),
      색:getComputedStyle(gs[0]).getPropertyValue('--rc').trim()};
    d.remove(); return r;});
  ok('보석이 붙는다', gem.개수===2&&gem.클래스[0]==='legendary'&&gem.클래스[1]==='common',
     `${gem.leg} → ${gem.클래스.join(' / ')}`);
  ok('보석 크기는 --cw 비례', Math.abs(gem.비율-0.075)<0.01, `카드 폭의 ${(gem.비율*100).toFixed(1)}%`);
  ok('등급마다 색이 다르다', gem.색.toLowerCase()!=='#9aa6b4', `레전더리 ${gem.색}`);

  /* 2-b) 보석은 일러스트 아래 경계에 **걸터앉되** 효과문 글자는 건드리지 않는다.
     ⚠ 여기서는 회전한 상자의 `getBoundingClientRect` 가 오히려 정답이다 —
        45° 마름모의 바깥 꼭짓점 좌표가 곧 이 상자의 변이다(크기를 잴 때만 offsetWidth).
     ⚠ 140종 전부를 본다. 한 장만 재면 효과문이 짧은 카드를 골라 통과할 수 있다. */
  const place=await p.evaluate(()=>{
    const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;top:0';
    document.body.appendChild(d);
    let worst=null, over=0, sit=1e9;
    for(const n of Object.keys(POOL)){
      d.innerHTML=tcardHTML(n,{size:'md'});
      const c=d.querySelector('.tcard'), cw=c.offsetWidth;
      const g=d.querySelector('.rgem').getBoundingClientRect();
      const a=d.querySelector('.tart').getBoundingClientRect();
      const t=d.querySelector('.teff').getBoundingClientRect();
      const pad=parseFloat(getComputedStyle(d.querySelector('.teff')).paddingTop);
      const 침범=g.bottom-(t.top+pad);          /* 글자 시작선을 넘었나 */
      const 걸침=g.bottom-a.bottom;              /* 경계선 아래로 나온 정도 */
      if(침범>over){over=침범;worst=n;}
      if(걸침<sit)sit=걸침;
    }
    const r={worst, 침범:+over.toFixed(2), 걸침:+sit.toFixed(2), 수:Object.keys(POOL).length};
    d.remove(); return r;});
  ok('보석이 글자를 안 가린다', place.침범<=0,
     `${place.수}종 최대 침범 ${place.침범}px${place.worst?' ('+place.worst+')':''}`);
  ok('보석은 경계선에 걸터앉는다', place.걸침>0.5, `경계 아래로 ${place.걸침}px`);

  // 2-c) 레전더리 프리즘 — 두 겹이 얹히고, 숫자 뱃지는 그 위에 남는다
  const pr=await p.evaluate(()=>{
    const n=Object.keys(POOL).find(x=>POOL[x].r==='legendary');
    const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;top:0';
    d.innerHTML=tcardHTML(n,{size:'md'}); document.body.appendChild(d);
    const c=d.querySelector('.tcard');
    const be=getComputedStyle(c,'::before'), af=getComputedStyle(c,'::after');
    const st=getComputedStyle(c.querySelector('.tstat'));
    const r={n, 색조:{b:be.mixBlendMode,a:be.animationName,z:be.zIndex,op:+be.opacity},
      반사:{b:af.mixBlendMode,a:af.animationName,z:af.zIndex},
      뱃지z:st.zIndex};
    d.remove(); return r;});
  ok('레전더리 프리즘 두 겹', pr.색조.b==='color'&&pr.색조.a==='prismhue'
     &&pr.반사.b==='overlay'&&pr.반사.a==='prismgleam',
     `${pr.n} — 색조 ${pr.색조.b}/${pr.색조.a} · 반사 ${pr.반사.b}/${pr.반사.a}`);
  ok('숫자 뱃지는 프리즘 위', (+pr.뱃지z)>(+pr.색조.z),
     `뱃지 z${pr.뱃지z} > 프리즘 z${pr.색조.z} (ATK 붉은색·HP 청록색이 안 물든다)`);
  ok('색조는 옅게', pr.색조.op<=0.35, `opacity ${pr.색조.op}`);

  /* 2-d) 프리즘 강도 3단계 — 2단계에서 알갱이 층이, 3단계에서 액자가 더 붙는다.
     ⚠ `.pfx` 자신에 블렌드/변형이 걸리면 자식(액자)까지 한 덩어리로 합성돼 액자가 날아간다.
     ⚠ 액자는 줄 여백(.055×--cw)보다 얇아야 효과문 첫 글자를 안 가린다. */
  const lv=await p.evaluate(()=>{
    const n=Object.keys(POOL).find(x=>POOL[x].r==='legendary');
    const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;top:0';
    d.innerHTML=tcardHTML(n,{size:'md'}); document.body.appendChild(d);
    const c=d.querySelector('.tcard'), f=d.querySelector('.pfx');
    const cw=c.offsetWidth;
    const at=(v)=>{ prismSet(v);
      const s=getComputedStyle(f), a=getComputedStyle(f,'::after'), b=getComputedStyle(f,'::before');
      return {표시:s.display, 블렌드:s.mixBlendMode, 변형:s.transform,
              알갱이:b.mixBlendMode+'/'+(b.backgroundImage.match(/radial-gradient/g)||[]).length,
              액자:a.borderTopWidth, 액자굵기비:+(parseFloat(a.borderTopWidth)/cw).toFixed(3)}; };
    const r={n, cw, 일:at(1), 이:at(2), 삼:at(3)};
    prismSet(1); d.remove(); return r;});
  ok('1단계는 여분 층 없음', lv.일.표시==='none', `.pfx display:${lv.일.표시}`);
  ok('2단계 알갱이 6개', lv.이.표시==='block'&&lv.이.알갱이==='screen/6'&&lv.이.액자==='0px',
     `${lv.이.알갱이} · 액자 ${lv.이.액자}`);
  ok('3단계 액자', parseFloat(lv.삼.액자)>0&&lv.삼.액자굵기비>0.02,
     `테두리 폭 ${lv.삼.액자} (카드 폭의 ${(lv.삼.액자굵기비*100).toFixed(1)}%)`);
  ok('액자가 글자를 안 가린다', lv.삼.액자굵기비+0.010<=0.055,
     `홈+띠 ${(lv.삼.액자굵기비+0.010).toFixed(3)} ≤ 줄 여백 0.055`);
  ok('.pfx 는 블렌드·변형 없음', lv.삼.블렌드==='normal'&&(lv.삼.변형==='none'||lv.삼.변형==='matrix(1, 0, 0, 1, 0, 0)'),
     `blend ${lv.삼.블렌드} · transform ${lv.삼.변형}`);

  // 3) 보상 가중치가 실제로 분포를 기울인다 (정예가 상위 등급을 더 많이 준다)
  const dist=await p.evaluate(()=>{
    RG.el='fire';
    const run=(elite)=>{const c={common:0,uncommon:0,rare:0,legendary:0};
      for(let i=0;i<4000;i++){
        const n=pickByRarity(poolOf('fire'), elite?'elite':'normal');
        c[(POOL[n]||{}).r||'common']++; }
      return c;};
    return {일반:run(false), 정예:run(true)};});
  const hi=o=>o.rare+o.legendary;
  ok('정예 보상이 더 좋다', hi(dist.정예)>hi(dist.일반)*1.4,
     `레어+레전더리 — 일반 ${hi(dist.일반)} vs 정예 ${hi(dist.정예)} (4000회)`);
  ok('커먼이 여전히 다수', dist.일반.common>dist.일반.legendary*3,
     `일반 커먼 ${dist.일반.common} · 레전더리 ${dist.일반.legendary}`);

  // 4) 적 덱 — 난이도 단계가 오를수록 상위 등급이 늘어난다
  const foe=await p.evaluate(()=>{
    const rar=n=>((POOL[n.replace(/^강화 /,'')]||{}).r)||'common';
    const hi=d=>d.reduce((s,[n,k])=>s+((rar(n)==='rare'||rar(n)==='legendary')?k:0),0);
    /* 곡선이 좁은 일반 등급으로 본다 — 정예·보스는 처음부터 비싼 카드를 들어 차이가 안 난다 */
    const es=FOES.filter(e=>e.tier==='normal');
    const avg=b=>es.reduce((s,e)=>s+hi(e.decks[b]||[]),0)/es.length;
    return {일:+avg(0).toFixed(2), 이:+avg(1).toFixed(2), 삼:+avg(2).toFixed(2), 수:es.length};});
  ok('단계가 오르면 덱이 좋아진다', foe.삼>foe.일,
     `일반 적 ${foe.수}명 평균 레어+레전더리 — 1단계 ${foe.일} → 2단계 ${foe.이} → 3단계 ${foe.삼}장`);

  // 5) 뷰어 — 희귀도 필터
  const v=await b.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:2});
  await v.goto(VIEW); await v.waitForTimeout(800);
  const chips=await v.evaluate(()=>[...document.querySelectorAll('#rarBar .chip')].map(e=>e.textContent.trim()));
  ok('뷰어 희귀도 칩', chips.length===5&&/레전더리/.test(chips[4]), chips.join(' · '));
  await v.click('#rarBar .chip[data-r="legendary"]'); await v.waitForTimeout(350);
  const only=await v.evaluate(()=>[...document.querySelectorAll('.cell')]
    .every(e=>(POOL[e.dataset.n]||{}).r==='legendary'));
  const n=await v.evaluate(()=>document.querySelectorAll('.cell').length);
  ok('레전더리만 걸러진다', only&&n===cntLeg(), `${n}종`);
  function cntLeg(){ return Object.values(pool).filter(c=>c.r==='legendary').length; }

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
