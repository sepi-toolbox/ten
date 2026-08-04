const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1020,height:1400}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(150);
/* 원정 진입: 모드 → 덱 선택 페이지 */
await p.evaluate(()=>{FLOW.mode='rogue';pgDeck();}); await p.waitForTimeout(300);
await p.click('#page .chsi[data-e="nature"]'); await p.waitForTimeout(500);
await p.evaluate(()=>{RG.floor=2;RG.at=0;rgShop();}); await p.waitForTimeout(250);
console.log('상점 재고:',await p.$$eval('#rg .rgc',e=>e.length),'(5여야 함)');
/* ⚠ 강화 카드가 **보이는지** 반드시 확인할 것. 클래스 이름을 'over' 로 썼더니
   패배 화면 `.over{display:none}` 에 걸려 0×0 으로 사라져 있었다(오래 못 잡던 버그). */
{ const z=await p.$$eval('#rg .rgc',es=>es.filter(e=>!e.getBoundingClientRect().width).length);
  console.log(`${z?'❌':'✅'} 안 보이는 카드 ${z}장 (0이어야 함)`);
  const ov=await p.$$eval('#rg .rgc.ovr',e=>e.length);
  console.log(`   강화 표시 카드 ${ov}장 · .rgc.over 잔재 ${await p.$$eval('#rg .rgc.over',e=>e.length)}장(0이어야 함)`); }
// 카드 제거 흐름
const before=await p.evaluate(()=>RG.deck.length);
await p.click('#rgRm'); await p.waitForTimeout(200);
console.log('제거 화면 카드:',await p.$$eval('#rg .rgc',e=>e.length));
await p.click('#rg .rgc'); await p.waitForTimeout(250);
console.log('제거 후 덱:',await p.evaluate(()=>RG.deck.length),`(${before-1}이어야 함)`, '골드',await p.evaluate(()=>RG.gold));
// 강화 흐름
await p.evaluate(()=>{rgUpgrade(1,()=>rgMap());}); await p.waitForTimeout(250);
await p.click('#rg .rgc'); await p.waitForTimeout(250);
const up=await p.evaluate(()=>RG.deck.filter(n=>POOL[n].over).length);
console.log('강화된 카드 수:',up);
// 속성 잠금 확인 — 덱·상점·보상 전부 nature 인가
const lock=await p.evaluate(()=>{
  const els=new Set(RG.deck.map(n=>POOL[n].el));
  const rw=rewardPool(true).map(n=>POOL[n].el);
  return {덱속성:[...els], 보상속성:[...new Set(rw)]};});
console.log('속성 잠금:',JSON.stringify(lock));
// 전투 2회 자동
for(let t=0;t<2;t++){
  await p.evaluate(()=>{RG.floor=Math.min(RG.floor+1,RG.map.length-2);RG.at=0;rgFight('normal');});
  await p.waitForTimeout(400);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{S.ai.hp=0;checkEnd();}); await p.waitForTimeout(350);
  const n=await p.$$eval('#rg .rgc',e=>e.length);
  if(n){ await p.click('#rg .rgc'); await p.waitForTimeout(250); }
  console.log(` 전투${t+1} 후 덱 ${await p.evaluate(()=>RG.deck.length)}장 · 골드 ${await p.evaluate(()=>RG.gold)} · 클리어 ${await p.evaluate(()=>RG.cleared)}`);
}
/* ── 내 덱 화면이 **지형까지** 보여 주는가 ────────────────────────
   ⚠ 예전엔 카드 23장만 그리고 지형은 아예 안 보였다. 원정 보상으로 지형을 얻을 수 있게 된
     뒤로는 '무슨 지형을 들고 있나' 가 곧 덱 정보인데 확인할 길이 없었다.
   ⚠ 지형 구성 계산은 runLands() 한 곳에만 있어야 한다 — 전투(startFight)와 이 화면이
     갈리면 "보이는 덱" 과 "실제로 싸우는 덱" 이 달라진다. */
const DV=await p.evaluate(()=>{
  RG.el='fire'; RG.deck=[]; RG.lands=[];
  DECKS.fire.list.forEach(([n,c])=>{ if(!isLand(n))for(let i=0;i<c;i++)RG.deck.push(n); });
  const 기본만=runLands();
  RG.lands=['화염의 원천','지하 감옥'];        // 보상으로 지형 둘을 얻은 상태
  const 보상후=runLands();
  rgDeckView();
  const lbl=[...document.querySelectorAll('#rg .lbl')].map(e=>e.textContent);
  const rows=[...document.querySelectorAll('#rg .rgcards')];
  const 지형칸=rows[1]?[...rows[1].querySelectorAll('.tname')].map(e=>e.textContent):[];
  /* 전투가 쓰는 값과 화면이 쓰는 값이 같은가 — PDECK 을 실제로 쌓아 본다 */
  const pd=[]; runLands().forEach(([n,c])=>pd.push(n+'x'+c));
  return {기본만:기본만.map(([n,c])=>n+'x'+c).join(' '),
          보상후:보상후.map(([n,c])=>n+'x'+c).join(' '),
          합계:보상후.reduce((a,[,c])=>a+c,0),
          구획:lbl.join(' | '), 지형칸:지형칸.join(','), 전투값:pd.join(' ')};
});
let dbad=0; const dok=(k,v,d)=>{ if(!v)dbad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

/* ── 이겼는데 '전투 처리 중…' 에서 안 넘어가던 것 ─────────────────
   ⚠⚠ checkEnd() 가 **busy 를 켠 채로** render() 를 했고, 부르는 쪽은 그 뒤에 S.busy=false 만
     하고 다시 안 그렸다. 그래서 가리개가 화면에 남았고, 가리개(z-index 140)가 보상 창(80)
     위를 덮어 **카드를 누를 수 없는 채로 멈췄다.** 창은 보이는데 죽어 있어서 더 헷갈렸다.
   고친 것 둘: busy 는 checkEnd 가 직접 끈다 · 가리개 z-index 를 창들 아래로 내렸다.
   ⚠ 이 검사는 hp 를 0 으로 **직접 넣지 않는다** — 실제로 공격해서 이겨야 그 경로를 지난다. */
await p.evaluate(()=>{SPEED=60;RG.on=false;rgStart('fire');}); await p.waitForTimeout(400);
await p.evaluate(()=>{RG.floor=0;RG.at=0;rgFight('normal');}); await p.waitForTimeout(600);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(300);
await p.evaluate(()=>{ S.ai.hp=1; S.ai.board=[]; S.me.board=[];
  placeCreature('me','헬하운드',0); S.me.board[0].sick=false; render(); });
await p.waitForTimeout(200);
await p.evaluate(()=>{ const e=document.getElementById('end'); if(!e.disabled)e.click(); });
await p.waitForTimeout(2200);
const W=await p.evaluate(()=>({
  끝남:S.over, busy:S.busy,
  가리개:document.getElementById('busy').classList.contains('on'),
  가리개z:+getComputedStyle(document.getElementById('busy')).zIndex,
  모달z:+getComputedStyle(document.getElementById('rg')).zIndex,
  창:document.getElementById('rg').classList.contains('on'),
  보상칸:document.querySelectorAll('#rg .rgc').length}));
const deck0=await p.evaluate(()=>RG.deck.length);
let clicked=true;
await p.click('#rg .rgc',{timeout:3000}).catch(()=>{clicked=false;});
await p.waitForTimeout(500);
const deck1=await p.evaluate(()=>RG.deck.length);
dok('이기면 판이 끝난다', W.끝남&&W.busy===false, `over=${W.끝남} busy=${W.busy}`);
dok('가리개가 걷힌다', W.가리개===false, `'전투 처리 중' 가리개 ${W.가리개?'남아 있음':'걷힘'}`);
/* ⚠ 가리개는 흐름 페이지까지 덮어야 하므로 창(z 80)보다 **위**에 있는 게 맞다(z 140).
   그래서 안전장치는 z-index 가 아니라 **제때 끄는 것** — 켜진 채 남으면 창이 죽는다. */
dok('가리개가 창 위다(정상)', W.가리개z>W.모달z, `가리개 z${W.가리개z} > 창 z${W.모달z} — 그래서 반드시 꺼야 한다`);
dok('보상 창이 뜬다', W.창&&W.보상칸===3, `창 ${W.창} · 카드 ${W.보상칸}장`);
dok('보상 카드가 눌린다', clicked&&deck1===deck0+1, `덱 ${deck0}→${deck1}${clicked?'':' (클릭이 막혔다)'}`);

/* ⚠ 기본 지형이 **여러 종**이다(불 = 불지옥·용암 폭포·용암 동굴). 17장을 고르게 나눠 담고,
   나머지는 앞쪽부터 한 장씩 간다 → 6/6/5. */
dok('기본 지형 3종 고르게', DV.기본만==='불지옥x6 용암 폭포x6 용암 동굴x5', DV.기본만);
/* 특수 지형을 얻으면 **기본 지형 몫에서 뺀다** — 총 장수는 그대로 17 이다 */
dok('보상 지형은 기본을 대체', DV.보상후==='불지옥x5 용암 폭포x5 용암 동굴x5 화염의 원천x1 지하 감옥x1'
    &&DV.합계===17, `${DV.보상후} (합 ${DV.합계})`);
dok('덱 화면에 카드·지형 두 구획', DV.구획==='카드 23장 | 지형 17장', DV.구획);
dok('지형 칸이 실제로 그려진다', DV.지형칸==='불지옥,용암 폭포,용암 동굴,화염의 원천,지하 감옥',
    DV.지형칸||'(없음)');
dok('화면과 전투가 같은 값', DV.전투값===DV.보상후, `화면 ${DV.보상후} / 전투 ${DV.전투값}`);
if(dbad)errs.push(`덱 화면 ${dbad}건 실패`);
console.log('ERRORS:',errs.slice(0,3));
await b.close(); process.exit(dbad?1:0);})();
