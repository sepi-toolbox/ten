/* 모바일 세로 UI 회귀 — 한 화면에 들어가는가 · 손패 겹침 · 조작이 되는가
 *   node tools/test_mobile.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
const SIZES=[[390,844,'iPhone 14'],[360,780,'작은 안드로이드'],[430,932,'Pro Max'],[820,1180,'태블릿 세로']];
(async()=>{
  const b=await chromium.launch(); let bad=0;
  for(const [w,h,label] of SIZES){
    const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(FILE); await p.waitForTimeout(600);
    await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(200);
    await p.evaluate(()=>{SPEED=30;setDeck('fire');}); await p.waitForTimeout(250);
    await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(250);
    await p.evaluate(()=>{
      while(S.me.lands.length<6){S.me.landPlayed=false;const j=S.me.hand.findIndex(isLand);
        if(j<0)break;playLand('me',S.me.hand[j]);S.me.hand.splice(j,1);}
      S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
      while(S.me.hand.length<7)draw('me');
      const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire');
      /* 낼 수 있는 크리처 한 장은 손에 보장한다 — 무작위 드로우로 테스트가 흔들리지 않게 */
      const cheap=cr.filter(n=>POOL[n].c<=2).sort((a,b)=>POOL[a].c-POOL[b].c)[0];
      /* 맨 오른쪽에 둔다 — 부채꼴에서 마지막 카드가 온전히 드러나고 맨 위에 놓인다 */
      if(cheap)S.me.hand[S.me.hand.length-1]=cheap;
      placeCreature('ai',cr[0],0); render();});
    await p.waitForTimeout(300);
    const m=await p.evaluate(()=>{
      const hand=document.getElementById('hand'), hb=hand.getBoundingClientRect();
      const cs=[...hand.children].map(c=>c.getBoundingClientRect());
      const vis=cs.length>1?Math.round(cs[1].left-cs[0].left):999;
      return {스크롤:document.documentElement.scrollHeight>innerHeight+2,
        손패밖:cs.length?(cs[0].left<-2||cs[cs.length-1].right>innerWidth+2):false,
        보이는폭:vis, 카드폭:cs.length?Math.round(cs[0].width):0,
        바닥초과:Math.round(hb.bottom)>innerHeight+2};});
    // 드래그로 소환
    const i=await p.evaluate(()=>S.me.hand.findIndex(n=>POOL[n]&&POOL[n].k==='cr'&&canPay('me',n)));
    const el=await p.$(`#hand .hcw[data-h="${i}"]`); const bx=await el.boundingBox();
    const board=await (await p.$('#myBoard')).boundingBox();
    // 맨 오른쪽 카드는 통째로 드러나 있으므로 가운데를 집는다
    const gx=bx.x+bx.width/2;
    await p.mouse.move(gx,bx.y+bx.height/2); await p.mouse.down();
    await p.mouse.move(gx,bx.y-40,{steps:4});
    await p.mouse.move(board.x+board.width/2,board.y+board.height/2,{steps:6});
    await p.mouse.up(); await p.waitForTimeout(400);
    const played=await p.evaluate(()=>S.me.board.filter(x=>x).length);
    // 길게 눌러 확대
    const el2=await p.$('#hand .hcw:last-child'); const b2=await el2.boundingBox();
    await p.mouse.move(b2.x+b2.width/2,b2.y+b2.height/2); await p.mouse.down(); await p.waitForTimeout(650);
    const zoom=await p.$eval('#zoom',e=>e.classList.contains('on'));
    await p.mouse.up(); await p.evaluate(()=>{hideZoom();lpFired=false;}); await p.waitForTimeout(200);
    // 서랍
    await p.click('#sideBtn'); await p.waitForTimeout(300);
    const drawer=await p.evaluate(()=>{const s=document.querySelector('.side').getBoundingClientRect();
      return document.body.classList.contains('sideon')&&s.top<innerHeight-40;});
    const ok=!m.스크롤&&!m.손패밖&&!m.바닥초과&&played>0&&zoom&&drawer&&!errs.length;
    if(!ok)bad++;
    console.log(`${ok?'✅':'❌'} ${label.padEnd(9)} ${w}×${h} | 스크롤없음 ${!m.스크롤} · 손패안쪽 ${!m.손패밖}`
      +` · 카드 ${m.카드폭}px(보이는폭 ${m.보이는폭}) · 드래그소환 ${played>0} · 확대 ${zoom} · 서랍 ${drawer}`
      +(errs.length?` · ERR ${errs[0]}`:''));
    await p.close();
  }
  console.log(bad?`❌ ${bad}/${SIZES.length} 실패`:`✅ ${SIZES.length}종 전부 통과`);
  await b.close(); process.exit(bad?1:0);
})();
