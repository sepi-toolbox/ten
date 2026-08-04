const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
let BAD2=0; const ok2=(k,v,d)=>{ if(!v)BAD2++; console.log((v?'✅':'❌')+' '+String(k).padEnd(22)+' '+d); };
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1400}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(150);
await p.evaluate(()=>{SPEED=40;});
await p.evaluate(()=>{FLOW.mode='rogue';pgDeck();});await p.waitForTimeout(300);
await p.click('#page .chsi[data-e="nature"]');await p.waitForTimeout(500);
/* ⚠ 원정은 이제 **튜토리얼 전투**로 시작한다. 이 검사는 지도와 적 명단을 보는 것이므로
   사람이 '건너뛰기' 를 누르는 것과 같은 길로 넘긴다. */
await p.evaluate(()=>{ if(TUT.on)tutEnd(); }); await p.waitForTimeout(900);
console.log('적 명단:',await p.evaluate(()=>FOES.length),'명 · 내 속성 제외 후보',
  await p.evaluate(()=>FOES.filter(e=>e.el!=='nature').length));
// 지도에 적 이름이 붙었나
const names=await p.$$eval('#rg .mnode .nm',e=>e.map(x=>x.textContent));
const styles=await p.$$eval('#rg .mnode .fs',e=>e.map(x=>x.textContent.trim()));
console.log('지도 노드:',names.slice(0,8).join(' / '));
console.log('스타일표시:',styles.slice(0,5).join(' / '),`(전투노드 ${styles.length}개)`);
console.log('내 속성 섞임:',await p.evaluate(()=>RG.map.flat().filter(n=>n.e&&FOEBY[n.e].el==='nature').length),'(0이어야)');
// 조우 화면
await p.click('#rg .mnode.can'); await p.waitForTimeout(400);
const enc=await p.evaluate(()=>{
  const c=document.querySelector('.foecard'); if(!c)return null;
  return {이름:c.querySelector('.fnm').textContent,
    태그:[...c.querySelectorAll('.ftag .pill')].map(x=>x.textContent.trim()),
    소개:c.querySelector('.fdesc').textContent.slice(0,28),
    초상화:!!c.querySelector('.fart').style.backgroundImage,
    주력:[...document.querySelectorAll('.rgcards.sm .rgc .tname')].map(x=>x.textContent)};});
console.log('조우:',JSON.stringify(enc,null,0));
// 전투 시작
await p.click('#rgGo'); await p.waitForTimeout(500);
await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(300);
console.log('전투:',await p.evaluate(()=>({
  적HP:S.ai.hp, 적최대:S.ai.maxhp, 내HP:S.me.hp, 내최대:S.me.maxhp,
  적이름표시:document.querySelector('#foeBar .who').textContent,
  적덱:S.ai.deck.length+S.ai.hand.length,
  적속성:[...new Set(S.ai.deck.concat(S.ai.hand).filter(n=>POOL[n]).map(n=>POOL[n].el))],
  바폭:document.getElementById('foeHpBar').style.width})));
// 난이도 단계별 덱 차이
console.log('난이도 단계별 곡선(사나운 고블린):',await p.evaluate(()=>{
  const e=FOEBY['fire_goblin'];
  return e.decks.map(d=>{const c={};let over=0;
    d.forEach(([n,k])=>{const b=n.replace(/^강화 /,'');if(n!==b)over+=k;
      const cc=(POOL[n]||POOL[b]).c;c[cc]=(c[cc]||0)+k;});
    return [1,2,3,4,5,6].map(i=>c[i]||0).join('/')+` 강화${over}`;});}));
const hps=await p.evaluate(()=>[0,3,6,9].map(f=>`${f}층 일반${foeHpFor('normal',f)}·정예${foeHpFor('elite',f)}`).join(' | '));
const bhp=await p.evaluate(()=>foeHpFor('boss',10));
console.log('층별 적 체력:',hps,'| 보스(10층)',bhp);
console.log('ERRORS:',errs.slice(0,4));
/* ── 고정 적 덱 10종(불·물) ─────────────────────────────────
   ⚠ 카드를 지우면 고정 덱이 **조용히 빈 덱**이 된다. 실제로 불 전면 교체 때 그래서 5종을
     통째로 내렸다. 여기서 '쓰는 카드가 전부 POOL 에 있는가' 를 매번 확인한다. */
const FX=await p.evaluate(()=>{
  const out=[];
  FOES.filter(e=>e.fixed).forEach(e=>{
    e.decks.forEach((d,band)=>{
      const miss=d.filter(([n])=>!POOL[n]).map(([n])=>n);
      const cards=d.reduce((a,[,c])=>a+c,0);
      const lands=(e.lands||[]).reduce((a,[,c])=>a+c,0);
      const badLand=(e.lands||[]).filter(([n])=>!LANDS[n]).map(([n])=>n);
      const kind={cr:0,sp:0,en:0};
      d.forEach(([n,c])=>{ const g=POOL[n]; if(g)kind[g.k]=(kind[g.k]||0)+c; });
      out.push({이름:e.name,단계:band+1,카드:cards,지형:lands,없는카드:miss,없는지형:badLand,
                크:kind.cr,스:kind.sp,인:kind.en});
    });
  });
  return out;
});
const missCard=FX.filter(x=>x.없는카드.length);
const missLand=FX.filter(x=>x.없는지형.length);
const badN=FX.filter(x=>x.카드!==23||x.지형!==17);
/* 크리처만 23장인 덱은 '덱' 이 아니라 그냥 몸 더미다 — 스펠이 최소 둘은 있어야 한다 */
const noSpell=FX.filter(x=>x.스<2);
ok2('고정 덱 10종 · 3단계', FX.length===30, `${FX.length}개 (적 ${FX.length/3}종 × 3단계)`);
ok2('없는 카드 안 씀', missCard.length===0,
    missCard.map(x=>`${x.이름}${x.단계} ${x.없는카드.join(',')}`).join(' · ')||'전부 POOL 에 있다');
ok2('없는 지형 안 씀', missLand.length===0,
    missLand.map(x=>`${x.이름} ${x.없는지형.join(',')}`).join(' · ')||'전부 lands.csv 에 있다');
ok2('전부 카드23 + 지형17', badN.length===0,
    badN.map(x=>`${x.이름}${x.단계} 카드${x.카드}/지형${x.지형}`).join(' · ')||'30개 모두 40장');
ok2('스펠이 최소 2장', noSpell.length===0,
    noSpell.map(x=>`${x.이름}${x.단계} 스펠${x.스}`).join(' · ')||'전부 2장 이상');
console.log('  고정 덱 비율(1단계):');
FX.filter(x=>x.단계===1).forEach(x=>console.log(`    ${x.이름.padEnd(14)} 크${x.크} 스${x.스} 인${x.인}`));

if(BAD2)console.log(`❌ 고정 덱 ${BAD2}건 실패`);
await b.close();})();
