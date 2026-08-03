const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1400}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(150);
await p.evaluate(()=>{SPEED=40;});
await p.evaluate(()=>{FLOW.mode='rogue';pgDeck();});await p.waitForTimeout(300);
await p.click('#page .chsi[data-e="nature"]');await p.waitForTimeout(500);
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
await b.close();})();
