/* 한 화면 레이아웃 회귀 — 세로·가로·태블릿·데스크톱 모두 스크롤 없이 들어가는가 ·
 * 조작 줄이 판 사이 가운데에 오는가 · 손패 겹침 · 조작이 되는가
 *   node tools/test_mobile.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
/* 앱(주소창 없음) · 브라우저(주소창 있음) 두 경우를 모두 본다 —
   카드 크기가 dvh 에 묶여 있어 세로가 짧으면 알아서 줄어야 한다. */
/* ⚠ 가로·태블릿·데스크톱을 반드시 포함할 것. 예전에는 레이아웃이 `@media(max-width:900px)`
   안에만 있어서, 아이패드 가로에서 조작 줄이 화면 밖 맨 아래로 밀리고 페이지가 스크롤됐다. */
const SIZES=[[390,844,'iPhone 앱'],[390,745,'iPhone 브라우저'],[360,640,'작은 폰 브라우저'],
             [430,932,'Pro Max 앱'],[820,1180,'태블릿 세로'],
             [1194,834,'태블릿 가로'],[1024,768,'구형 태블릿 가로'],
             [1440,900,'노트북'],[844,390,'폰 가로']];
(async()=>{
  const b=await chromium.launch(); let bad=0;
  for(const [w,h,label] of SIZES){
    const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(FILE+'?dev=1'); await p.waitForTimeout(600);
    await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(200);
    await p.evaluate(()=>{SPEED=30;setDeck('fire');}); await p.waitForTimeout(250);
    await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();}); await p.waitForTimeout(250);
    await p.evaluate(()=>{
      /* 손패에 지형이 모자랄 수 있으니 직접 채운다 — 마나 부족으로 테스트가 흔들리지 않게 */
      /* ⚠ BASICLAND 는 이제 **배열**이다(속성마다 기본 지형이 여러 종). 배열을 그대로
         넘기면 playLand 가 실패만 하고 while 이 **영원히 돈다** — 검사가 통째로 멈췄다.
         ⚠ 어떤 이유로든 안 깔리면 빠져나오도록 횟수 제한도 둔다. */
      const base=(BASICLAND.fire||['불지옥'])[0];
      for(let g=0;S.me.lands.length<6&&g<30;g++){S.me.landPlayed=false;playLand('me',base);}
      S.me.lands.forEach(l=>{l.used=false;l.entering=false;});
      while(S.me.hand.length<7)draw('me');
      const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire');
      /* 낼 수 있는 크리처 한 장은 손에 보장한다 — 무작위 드로우로 테스트가 흔들리지 않게 */
      const cheap=cr.filter(n=>POOL[n].c<=2&&!POOL[n].g).sort((a,b)=>POOL[a].c-POOL[b].c)[0];
      /* 맨 오른쪽에 둔다 — 부채꼴에서 마지막 카드가 온전히 드러나고 맨 위에 놓인다 */
      if(cheap)S.me.hand[S.me.hand.length-1]=cheap;
      placeCreature('ai',cr[0],0); render();});
    await p.waitForTimeout(300);
    const m=await p.evaluate(()=>{
      const hand=document.getElementById('hand'), hb=hand.getBoundingClientRect();
      const foe=document.getElementById('foeHand'), fb=foe.getBoundingClientRect();
      const cs=[...hand.children].map(c=>c.getBoundingClientRect());
      const vis=cs.length>1?Math.round(cs[1].left-cs[0].left):999;
      /* 양쪽 손패는 화면 밖으로 30% 정도 밀어 넣는다(70%만 보인다) — 밑으로 넘치는 건 정상.
         대신 **얼마나 보이는지**를 재고, 좌우로는 여백이 남아 있어야 한다. */
      const pct=(r)=>Math.round((Math.min(innerHeight,r.bottom)-Math.max(0,r.top))/r.height*100);
      return {스크롤:document.documentElement.scrollHeight>innerHeight+2,
        손패밖:cs.length?(cs[0].left<-2||cs[cs.length-1].right>innerWidth+2):false,
        보이는폭:vis, 카드폭:cs.length?Math.round(cs[0].width):0,
        내노출:pct(hb), 상대노출:pct(fb),
        /* 게임 화면은 스크롤하지 않는다 — .main 이 스크롤 가능하면 실패다 */
        판스크롤:getComputedStyle(document.querySelector('.main')).overflowY,
        /* 조작 줄(안내 + 턴 종료)은 두 판 **사이**에 있어야 한다 — 맨 아래로 밀리면 실패 */
        조작줄가운데:(()=>{const c=document.querySelector('.ctl').getBoundingClientRect();
          const f=document.getElementById('foeBoard').getBoundingClientRect();
          const m=document.getElementById('myBoard').getBoundingClientRect();
          return c.top>=f.bottom-2&&c.bottom<=m.top+2&&c.bottom<=innerHeight;})(),
        배지:[...document.querySelectorAll('.lzb')].map(x=>x.textContent).join(' '),
        라벨:document.querySelectorAll('.main .lbl').length,   /* 서랍 라벨은 그대로 둔다 */
        좌여백:cs.length?Math.round(cs[0].left):0,
        우여백:cs.length?Math.round(innerWidth-cs[cs.length-1].right):0};});
    // 드래그로 소환 — 겹친 손패에서 가운데 카드를 집으면 오른쪽 이웃이 먼저 잡힌다.
    // 맨 오른쪽(= 앞에서 심어 둔 저코 크리처)만 온전히 드러나 있으므로 그것으로 검사한다.
    const i=await p.evaluate(()=>S.me.hand.length-1);
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
    await p.click('#gearBtn'); await p.waitForTimeout(300);
    const drawer=await p.evaluate(()=>{const s=document.querySelector('.side').getBoundingClientRect();
      return document.body.classList.contains('sideon')&&s.top<innerHeight-40;});
    /* 내 손패는 70%, 상대 손패는 50%만 드러난다(크기는 둘 다 --cardw 로 같다) */
    const 노출OK=m.내노출>=62&&m.내노출<=80&&m.상대노출>=44&&m.상대노출<=58;
    const 여백OK=m.좌여백>=6&&m.우여백>=6;
    const 판OK=m.판스크롤==='hidden'&&m.배지.split(' ').length===2&&m.라벨===0&&m.조작줄가운데;
    const ok=!m.스크롤&&!m.손패밖&&노출OK&&여백OK&&판OK&&played>0&&zoom&&drawer&&!errs.length;
    if(!ok)bad++;
    console.log(`${ok?'✅':'❌'} ${label.padEnd(9)} ${w}×${h} | 스크롤없음 ${!m.스크롤} · 손패안쪽 ${!m.손패밖}`
      +` · 노출 내 ${m.내노출}%/상대 ${m.상대노출}% · 좌우여백 ${m.좌여백}/${m.우여백}`
      +` · 판스크롤 ${m.판스크롤} · 조작줄가운데 ${m.조작줄가운데} · 배지 ${m.배지}`
      +` · 카드 ${m.카드폭}px(보이는폭 ${m.보이는폭}) · 드래그소환 ${played>0} · 확대 ${zoom} · 서랍 ${drawer}`
      +(errs.length?` · ERR(${errs.length}) ${errs[0]}`:''));
    await p.close();
  }
  console.log(bad?`❌ ${bad}/${SIZES.length} 실패`:`✅ ${SIZES.length}종 전부 통과`);
  await b.close(); process.exit(bad?1:0);
})();
