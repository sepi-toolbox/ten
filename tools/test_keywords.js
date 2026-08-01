const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1100,height:1200}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto('file:///home/claude/ten/prototype/index.html');await p.waitForTimeout(700);
await p.click('#keepBtn').catch(()=>{});await p.waitForTimeout(200);
await p.evaluate(()=>{SPEED=40;});await p.waitForTimeout(150);
const R=await p.evaluate(async()=>{
  const out=[]; const ok=(k,pass,detail)=>out.push({k,pass,detail});
  const reset=()=>{ S.gen=(S.gen||0)+1; S.me.board=Array(SLOTS).fill(null); S.ai.board=Array(SLOTS).fill(null);
    S.me.hp=60; S.ai.hp=60; S.me.hand=[]; S.ai.hand=[]; S.over=false; S.busy=false; };
  const put=(p,n,i)=>{placeCreature(p,n,i);onSummon(p,n,i);};
  const hp=(p,i)=>{const u=S[p].board[i];return u&&u.insts[0]?u.insts[0].hp:null;};

  // 연소 3 — 3번의 내 턴 종료 뒤 소멸
  reset(); put('me','불씨정령',0);
  let seq=[];
  for(let t=0;t<3;t++){ endStep('me'); seq.push(S.me.board[0]?S.me.board[0].burn:'소멸'); }
  ok('연소', seq.join(',')==='2,1,소멸', `턴마다 ${seq.join(' → ')}`);

  // 폭산 3 — 소멸 시 적 전체 3 피해
  reset(); put('me','불꽃광대',0); put('ai','용암거인',0); put('ai','심연룡',1);
  const bh=[hp('ai',0),hp('ai',1)];
  S.me.board[0].insts[0].hp=0; cleanup('me');
  ok('폭산', hp('ai',0)===bh[0]-3&&hp('ai',1)===bh[1]-3, `적 체력 [${bh}] → [${hp('ai',0)},${hp('ai',1)}]`);

  // 환류 — 소멸 시 손으로
  reset(); put('me','심해수호',0); S.me.hand=[];
  S.me.board[0].insts[0].hp=0; cleanup('me');
  ok('환류', S.me.hand.includes('심해수호'), `손패 ${JSON.stringify(S.me.hand)}`);

  // 밀물 2 — 2코 이하 상대 크리처를 손으로
  reset(); put('ai','돌덩이',0); put('ai','장군',1); S.ai.hand=[];
  const c0=POOL['돌덩이'].c, c1=POOL['장군'].c;
  put('me','해류지기',0);
  ok('밀물', S.ai.board[0]===null&&S.ai.board[1]!==null&&S.ai.hand.includes('돌덩이'),
     `돌덩이 ${c0}코 회수됨=${S.ai.board[0]===null} · 장군 ${c1}코 유지=${S.ai.board[1]!==null}`);

  // 증식 — 턴 종료 시 왼쪽 빈 슬롯에 복제 (중첩 아님)
  reset(); put('me','번식체',0);
  endStep('me');
  const cp=S.me.board[1];
  const linear=[];
  for(let t=0;t<3;t++){ endStep('me'); linear.push(S.me.board.filter(x=>x).length); }
  ok('증식', !!cp&&cp.name==='번식체'&&S.me.board[0].insts.length===1&&!cp.breed&&cp.bred
      &&linear.join(',')==='3,4,5',
     `슬롯2에 복제 · 원본 중첩 안 함 · 복제본 재증식 안 함 · 턴별 ${[2].concat(linear).join('→')}종`);
  // 보드가 꽉 차면 그 턴은 건너뛴다
  reset(); put('me','번식체',0);
  for(let k=1;k<SLOTS;k++)put('me','파수병',k);
  endStep('me');
  ok('증식 만석', S.me.board.filter(x=>x).length===SLOTS, `보드 ${S.me.board.filter(x=>x).length}/${SLOTS} 유지`);

  // 성장 +1/+1 (4회까지)
  reset(); put('me','묘목',0);
  const a0=S.me.board[0].a, h0=hp('me',0);
  for(let t=0;t<6;t++)endStep('me');
  const u=S.me.board[0];
  ok('성장', u.a===a0+4&&hp('me',0)===h0+4&&u.grow.left===0,
     `${a0}/${h0} → ${u.a}/${hp('me',0)} (4회 상한)`);

  // 경화 2 — 받는 피해 2 감소
  reset(); put('me','요새병',0);
  const hb=hp('me',0); hurtAll(S.me.board[0],5);
  ok('경화', hp('me',0)===hb-3, `5 피해 → 실제 ${hb-hp('me',0)}`);

  // 연마 — +1/+2 3회
  reset(); put('me','연마병',0);
  const a1=S.me.board[0].a,h1=hp('me',0);
  for(let t=0;t<5;t++)endStep('me');
  ok('연마', S.me.board[0].a===a1+3&&hp('me',0)===h1+6,
     `${a1}/${h1} → ${S.me.board[0].a}/${hp('me',0)} (3회 상한)`);

  // 진형 +4 — 앞열에서만 체력 가산
  reset(); put('me','성문지기',0); put('ai','성문지기',5);
  ok('진형', hp('me',0)===POOL['성문지기'].h+4 && S.ai.board[5].insts[0].hp===POOL['성문지기'].h,
     `슬롯1 ${hp('me',0)} vs 슬롯6 ${S.ai.board[5].insts[0].hp} (기본 ${POOL['성문지기'].h})`);

  // 대가 6 — 소환 시 HP 지불
  reset(); const bhp=S.me.hp; put('me','피의광신도',0);
  ok('대가', S.me.hp===bhp-6, `HP ${bhp} → ${S.me.hp}`);

  // 흡혈 2 — 공격 시 회복
  reset(); S.me.hp=40; put('me','흡혈박쥐',0); S.active='me';
  await resolveAttacks('me');
  ok('흡혈', S.me.hp===42, `HP 40 → ${S.me.hp}`);

  // 가호 — 첫 파괴 무효
  reset(); put('me','수호천사',0);
  const mh=S.me.board[0].insts[0].mh;
  S.me.board[0].insts[0].hp=0; cleanup('me');
  const survived=!!S.me.board[0], after=hp('me',0);
  if(S.me.board[0]){S.me.board[0].insts[0].hp=0;cleanup('me');}
  ok('가호', survived&&after===mh&&!S.me.board[0], `1차 생존(HP ${after}/${mh}) · 2차 파괴됨`);

  // 축복 8 — 소환 시 회복
  reset(); S.me.hp=40; put('me','사제',0);
  ok('축복', S.me.hp===48, `HP 40 → ${S.me.hp}`);

  // 커스텀 4종
  reset(); put('me','파수병',0); put('me','조수술사',1);
  ok('조수술사', S.me.board[0]===null&&S.me.hand.includes('파수병'), `손패 ${JSON.stringify(S.me.hand)}`);
  reset(); put('me','파수병',0); const qa=S.me.board[0].a,qh=hp('me',0); put('me','숲의 여왕',1);
  ok('숲의 여왕', S.me.board[0].a===qa+1&&hp('me',0)===qh+1, `파수병 ${qa}/${qh} → ${S.me.board[0].a}/${hp('me',0)}`);
  reset(); put('ai','파수병',0);put('ai','파수병',2);put('ai','파수병',5);
  const eh=hp('ai',0); put('me','지진술사',0);
  ok('지진술사', hp('ai',0)===eh-2&&hp('ai',2)===eh-2&&hp('ai',5)===eh,
     `슬롯1 ${hp('ai',0)} · 슬롯3 ${hp('ai',2)} · 슬롯6 ${hp('ai',5)} (기본 ${eh})`);
  reset(); put('me','불사조',0);
  S.me.board[0].insts[0].hp=0; cleanup('me');
  const tk=S.me.board.find(x=>x&&x.token);
  ok('불사조', !!tk&&tk.a===1, `잿불 토큰 ${tk?tk.a+'/'+tk.insts[0].hp:'없음'}`);

  // 토큰 렌더 (POOL 에 없는 이름이 보드에서 빈 칸으로 나오던 문제)
  reset(); S.me.board[0]=mkToken('잿불',1,1); render();
  const html=document.querySelector('#myBoard .slot.occ').innerHTML;
  ok('토큰 표시', html.includes('잿불')&&html.includes('tcard'), `길이 ${html.length}`);
  return out;
});
console.log('키워드'.padEnd(12),'결과');
console.log('─'.repeat(78));
let bad=0;
for(const r of R){ if(!r.pass)bad++;
  console.log((r.pass?'✅':'❌')+' '+r.k.padEnd(10),r.detail); }
console.log('─'.repeat(78));
console.log(bad?`❌ ${bad}건 실패 / ${R.length}건`:`✅ ${R.length}건 전부 통과`);
console.log('ERRORS:',errs.slice(0,4));
await b.close(); process.exit(bad?1:0);})();
