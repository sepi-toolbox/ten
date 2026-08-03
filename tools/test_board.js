/* 판(보드·지형존) 구조 — 끼워 넣기 · 구멍 없음 · 진형 재계산 · 가운데 정렬 겹침
 *   node tools/test_board.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(FILE);await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(250);
await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(250);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(300);
const R=await p.evaluate(()=>{
  const out=[]; const ok=(k,v,d)=>out.push((v?'✅':'❌')+' '+k.padEnd(20)+' '+d);
  const reset=()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];S.me.lands=[];render();};
  const cr=Object.keys(POOL).filter(n=>POOL[n].k==='cr'&&POOL[n].el==='fire');
  // 1) 끼워 넣기
  reset();
  placeCreature('me',cr[0]);           // 끝에
  placeCreature('me',cr[1]);
  placeCreature('me',cr[2],1);         // 가운데 끼워 넣기
  ok('가운데 끼워 넣기', S.me.board[1].name===cr[2],
     S.me.board.map(u=>u.name).join(' | '));
  placeCreature('me',cr[3],0);         // 맨 앞
  ok('맨 앞 끼워 넣기', S.me.board[0].name===cr[3], S.me.board.map(u=>u.name).join(' | '));
  // 2) 죽으면 구멍 없이 당겨진다
  S.me.board[1].insts[0].hp=0; cleanup('me');
  ok('구멍 없이 당겨짐', S.me.board.every(Boolean)&&S.me.board.length===3,
     `${S.me.board.length}장 · ${S.me.board.map(u=>u.name).join(' | ')}`);
  // 3) 상한
  reset(); for(let i=0;i<12;i++)placeCreature('me',cr[i%cr.length]);
  ok('상한 10', S.me.board.length===SLOTS&&!boardRoom('me'), `${S.me.board.length}/${SLOTS}`);
  // 4) 진형 — 앞자리로 밀리면 다시 붙는다
  reset();
  placeCreature('me',cr[0]);placeCreature('me',cr[1]);placeCreature('me',cr[2]);
  placeCreature('me','성문지기');        // 4번째 → 진형 없음
  const h0=S.me.board[3].insts[0].hp, f0=S.me.board[3].form;
  S.me.board[0].insts[0].hp=0; S.me.board[1].insts[0].hp=0; cleanup('me');
  const idx=S.me.board.findIndex(u=>u.name==='성문지기');
  ok('진형 재계산', f0===0&&idx<3&&S.me.board[idx].form>0&&S.me.board[idx].insts[0].hp>h0,
     `4번째 HP ${h0}(진형 ${f0}) → ${idx+1}번째 HP ${S.me.board[idx].insts[0].hp}(진형 ${S.me.board[idx].form})`);
  // 5) 렌더 — 놓은 것만, 가운데 정렬
  reset(); placeCreature('me',cr[0]);placeCreature('me',cr[1]); render();
  const bd=document.getElementById('myBoard');
  const cards=[...bd.querySelectorAll(':scope > .slot')];
  const bb=bd.getBoundingClientRect();
  const mid=(cards[0].getBoundingClientRect().left+cards[cards.length-1].getBoundingClientRect().right)/2;
  ok('놓은 것만 · 가운데', cards.length===2&&Math.abs(mid-(bb.left+bb.width/2))<3,
     `${cards.length}장 · 중심차 ${Math.round(mid-(bb.left+bb.width/2))}px · 카드폭 ${Math.round(cards[0].getBoundingClientRect().width)}px`);
  // 6) 지형존도 겹쳐 쌓임
  reset(); for(let i=0;i<8;i++){S.me.landPlayed=false;playLand('me','화산');} render();
  const lz=[...document.getElementById('myLz').querySelectorAll(':scope > .slot')];
  const step=lz.length>1?lz[1].getBoundingClientRect().left-lz[0].getBoundingClientRect().left:0;
  ok('지형 겹쳐 쌓임', lz.length===8&&step<lz[0].getBoundingClientRect().width-2,
     `${lz.length}장 · 카드폭 ${Math.round(lz[0].getBoundingClientRect().width)} · 간격 ${Math.round(step)}`);
  // 7) 손패 대비 판 카드 크기
  const hcw=document.querySelector('#hand .hcw');
  ok('판 카드가 너무 작지 않다',
     cards[0].getBoundingClientRect().width>=hcw.getBoundingClientRect().width*0.55,
     `판 ${Math.round(cards[0].getBoundingClientRect().width)} vs 손패 ${Math.round(hcw.getBoundingClientRect().width)}`);
  return out;});
await p.waitForTimeout(400);          // .slot 은 transition:.16s(all) — 배치가 끝난 뒤에 재야 한다
const late=await p.evaluate(()=>{
  const out=[]; const ok=(k,v,d)=>out.push((v?'✅':'❌')+' '+k.padEnd(20)+' '+d);
  const bd=document.getElementById('myBoard');
  const cards=[...bd.querySelectorAll(':scope > .slot')];
  const lz=[...document.getElementById('myLz').querySelectorAll(':scope > .slot')];
  const step=lz.length>1?lz[1].getBoundingClientRect().left-lz[0].getBoundingClientRect().left:0;
  /* 지형은 자리가 남아도 항상 겹쳐 쌓인다 */
  ok('지형 항상 겹침', lz.length===8&&step>0&&step<lz[0].getBoundingClientRect().width*0.6,
     `${lz.length}장 · 카드폭 ${Math.round(lz[0].getBoundingClientRect().width)} · 간격 ${Math.round(step)}`);
  const lzb=document.getElementById('myLz').getBoundingClientRect();
  const mid=(lz[0].getBoundingClientRect().left+lz[lz.length-1].getBoundingClientRect().right)/2;
  ok('지형 가운데 정렬', Math.abs(mid-(lzb.left+lzb.width/2))<3, `중심차 ${Math.round(mid-(lzb.left+lzb.width/2))}px`);
  const hcw=document.querySelector('#hand .hcw').getBoundingClientRect().width;
  const lw=lz[0].getBoundingClientRect().width;      /* 판을 비우기 전에 재 둔다 */
  S.me.board=[]; placeCreature('me',Object.keys(POOL).find(n=>POOL[n].k==='cr')); render();
  const bw=document.querySelector('#myBoard > .slot').getBoundingClientRect().width;
  /* 손패·크리처 판·지형존은 **같은 규격**이어야 한다 */
  ok('카드 규격 통일', Math.abs(bw-hcw)<1.5&&Math.abs(lw-hcw)<1.5,
     `크리처판 ${bw.toFixed(1)} · 지형 ${lw.toFixed(1)} · 손패 ${hcw.toFixed(1)}`);
  return out;});
console.log([...R.slice(0,6),...late].join('\n'));
console.log('ERRORS:',errs.slice(0,3));
await p.screenshot({path:'/tmp/board.png'});
await b.close();})();
