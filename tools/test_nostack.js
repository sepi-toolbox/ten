const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1020,height:1300}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto('file:///home/claude/ten/prototype/index.html');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=30;setDeck('fire');});await p.waitForTimeout(300);
await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});await p.waitForTimeout(250);
const R=await p.evaluate(()=>{
  const out=[]; const ok=(k,pass,d)=>out.push({k,pass,d});
  const reset=()=>{S.gen=(S.gen||0)+1;S.me.board=Array(SLOTS).fill(null);S.ai.board=Array(SLOTS).fill(null);
    S.me.hp=60;S.ai.hp=60;S.me.hand=[];S.over=false;S.busy=false;};
  // 1) 같은 이름을 같은 슬롯에 두 번 → 거부
  reset(); const a=placeCreature('me','파수병',0), c=placeCreature('me','파수병',0);
  ok('같은 슬롯 재소환 거부', a===true&&c===false&&S.me.board[0].insts.length===1,
     `1차 ${a} · 2차 ${c} · 개체수 ${S.me.board[0].insts.length}`);
  // 2) 같은 이름이라도 다른 슬롯이면 각각 한 칸
  reset(); placeCreature('me','파수병',0); placeCreature('me','파수병',1);
  ok('동명 별도 슬롯', S.me.board[0]&&S.me.board[1]&&S.me.board[0]!==S.me.board[1],
     `슬롯1·2 각각 점유 · 보드 ${S.me.board.filter(x=>x).length}종`);
  // 3) 드롭 판정에 중첩 경로가 없다
  reset(); placeCreature('me','파수병',0);
  ok('슬롯 판정', slotOkFor('place','파수병','me',0)===false&&slotOkFor('place','파수병','me',1)===true,
     `점유칸 ${slotOkFor('place','파수병','me',0)} · 빈칸 ${slotOkFor('place','파수병','me',1)}`);
  // 4) 자동 배치는 왼쪽 빈 칸
  reset(); placeCreature('me','파수병',0); placeCreature('me','검사',1);
  ok('자동 배치', autoIdx('place','파수병')===2, `→ 슬롯 ${autoIdx('place','파수병')+1}`);
  // 5) 보드 만석이면 소환 불가
  reset(); for(let i=0;i<SLOTS;i++)placeCreature('me','파수병',i);
  ok('만석 소환 불가', autoIdx('place','파수병')===-1, `빈 칸 ${autoIdx('place','파수병')}`);
  // 6) 카드에 ×N 뱃지가 더는 안 나온다
  reset(); placeCreature('me','파수병',0); render();
  const html=document.getElementById('myBoard').innerHTML;
  ok('×N 뱃지 제거', !html.includes('tstk')&&!html.includes('tpips')&&!html.includes('fstk'),
     `잔여 마크업 없음`);
  // 7) 증식은 여전히 빈 슬롯으로
  reset(); placeCreature('me','번식체',0); endStep('me');
  ok('증식 유지', S.me.board.filter(x=>x).length===2&&S.me.board[0].insts.length===1,
     `보드 ${S.me.board.filter(x=>x).length}종 · 원본 개체 ${S.me.board[0].insts.length}`);
  // 8) 토큰 다중 소환도 각각 슬롯
  reset(); S.me.board[0]=null;
  const sp=Object.keys(POOL).find(n=>POOL[n].mode==='summon'&&POOL[n].el==='fire');
  if(sp){ resolveSummon('me',sp,0);
    ok('토큰 다중 소환', S.me.board.filter(x=>x&&x.token).length>=1&&S.me.board.every(u=>!u||u.insts.length===1),
       `${sp} → 토큰 ${S.me.board.filter(x=>x&&x.token).length}칸`); }
  return out;
});
let bad=0;
for(const r of R){ if(!r.pass)bad++; console.log((r.pass?'✅':'❌')+' '+r.k.padEnd(16),r.d); }
console.log(bad?`❌ ${bad}건 실패`:`✅ ${R.length}건 전부 통과`);
console.log('ERRORS:',errs.slice(0,3));
await b.close(); process.exit(bad?1:0);})();
