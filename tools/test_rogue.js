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
console.log('ERRORS:',errs.slice(0,3));
await b.close();})();
