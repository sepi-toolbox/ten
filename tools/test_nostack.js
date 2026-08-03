const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto(FILE+'?dev=1');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(300);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
const R=await p.evaluate(()=>{
  const out=[]; const ok=(k,pass,d)=>out.push({k,pass,d});
  const reset=()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];
    S.me.hp=60;S.ai.hp=60;S.me.hand=[];S.over=false;S.busy=false;};
  // 1) 같은 이름을 두 번 내도 한 칸에 합쳐지지 않는다 (각자 제 자리를 차지한다)
  reset(); const a=placeCreature('me','파수병',0), c=placeCreature('me','파수병',0);
  ok('합쳐지지 않음', a&&c&&S.me.board.length===2
      &&S.me.board.every(u=>u.insts.length===1),
     `${S.me.board.length}칸 · 개체수 ${S.me.board.map(u=>u.insts.length).join(',')}`);
  // 2) 같은 이름이라도 다른 슬롯이면 각각 한 칸
  reset(); placeCreature('me','파수병'); placeCreature('me','파수병');
  ok('동명도 각자 한 칸', S.me.board[0]&&S.me.board[1]&&S.me.board[0]!==S.me.board[1],
     `보드 ${S.me.board.length}칸`);
  // 3) 자리가 남아 있는 한 어디든 끼울 수 있다
  reset(); placeCreature('me','파수병',0);
  ok('삽입 가능 판정', slotOkFor('place','파수병','me',0)===true,
     `자리 있음 ${slotOkFor('place','파수병','me',0)}`);
  // 4) 자동 배치는 목록의 끝
  reset(); placeCreature('me','파수병'); placeCreature('me','검사');
  ok('자동 배치', autoIdx('place','파수병')===2, `→ ${autoIdx('place','파수병')+1}번째`);
  // 5) 보드 만석이면 소환 불가
  reset(); for(let i=0;i<SLOTS+2;i++)placeCreature('me','파수병');
  ok('만석 소환 불가', autoIdx('place','파수병')===-1&&S.me.board.length===SLOTS,
     `${S.me.board.length}/${SLOTS} · 자리 ${autoIdx('place','파수병')}`);
  // 6) 카드에 ×N 뱃지가 더는 안 나온다
  reset(); placeCreature('me','파수병',0); render();
  const html=document.getElementById('myBoard').innerHTML;
  ok('×N 뱃지 제거', !html.includes('tstk')&&!html.includes('tpips')&&!html.includes('fstk'),
     `잔여 마크업 없음`);
  // 7) 증식은 여전히 빈 슬롯으로
  reset(); placeCreature('me','번식체'); endStep('me');
  ok('증식 유지', S.me.board.length===2&&S.me.board[0].insts.length===1,
     `보드 ${S.me.board.length}칸 · 원본 개체 ${S.me.board[0].insts.length}`);
  /* 8) 소환물도 **각각 한 칸씩** 차지한다.
     ⚠ 예전에는 토큰(POOL 밖 임시 개체)이었는데, 이제 소환 스펠은 **진짜 카드**를 부른다
        (그래야 크라켄 같은 바운스로 손에 잡힌다). 그래서 `u.token` 이 아니라 개체 수로 본다. */
  reset(); S.me.board[0]=null;
  const sp='불의 군단';
  if(sp){ resolveSummon('me',sp,0);
    ok('소환물 다중 소환', S.me.board.filter(Boolean).length>=2&&S.me.board.every(u=>!u||u.insts.length===1),
       `${sp} → 토큰 ${S.me.board.filter(x=>x&&x.token).length}칸`); }
  return out;
});
let bad=0;
for(const r of R){ if(!r.pass)bad++; console.log((r.pass?'✅':'❌')+' '+r.k.padEnd(16),r.d); }
console.log(bad?`❌ ${bad}건 실패`:`✅ ${R.length}건 전부 통과`);
console.log('ERRORS:',errs.slice(0,3));
await b.close(); process.exit(bad?1:0);})();
