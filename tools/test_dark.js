/* 어둠 2단계 — 단말마 · 출진 · 탈취 · 면역 아우라 · 무덤 · 어둠 주문
 *   node tools/test_dark.js
 *
 * 왜 이 파일이 있나 — 어둠의 정체성이 **죽는 것**에 걸려 있다. 단말마·부활·무덤은
 * 전부 cleanup → onDeath 라는 한 줄기를 지나는데, 여기가 어긋나면 카드가 조용히
 * 아무 일도 안 한다(값은 이미 치렀는데). 그래서 그 줄기를 통째로 훑는다.
 * ⚠ 카드 이름을 검사 조건에 박되, **없으면 이름을 밝히고 죽게** 한다 — 카드가 지워졌을 때
 *   "0건 실패" 로 읽히는 게 제일 나쁘다.
 */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(26)+' '+d); };
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(900);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{SPEED=60;setDeck('dark');}); await p.waitForTimeout(300);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(350);

  const R=await p.evaluate(()=>{
    SPEED=60; const o={};
    const need=n=>{ if(!POOL[n])throw new Error('POOL 에 없는 카드: '+n); return n; };
    const reset=()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;
      S.me.hand=[];S.ai.hand=[];S.me.deck=[];S.ai.deck=[];S.me.grave=[];S.ai.grave=[];
      S.dead=0;S.pick=null;S.me.lands=[];S.ai.lands=[];};
    const put=(pl,n,at)=>{ need(n); const i=at==null?S[pl].board.length:at;
      placeCreature(pl,n,i); onSummon(pl,n,i); return S[pl].board[i]; };
    const kill=u=>{ u.insts.forEach(i=>{i.hp=0;}); };
    const names=pl=>S[pl].board.filter(u=>u&&u.kind==='cr').map(u=>u.name).join(',');

    /* ── 단말마 — 드로우 ── */
    reset(); S.me.deck=['데스핸드','데스핸드','데스핸드'];
    const zr=put('me','좀비랫'); kill(zr); cleanup('me');
    o.드로우=[S.me.hand.length, S.me.grave.slice()];

    /* ── 단말마 — 죽은 자리에 다시(1회) ── */
    reset();
    put('me','구울'); const sk=put('me','스켈톤'); put('me','좀비');
    kill(sk); cleanup('me');
    o.부활자리=names('me');
    const sk2=S.me.board.find(u=>u.name==='스켈톤');
    o.부활1회=sk2?sk2.dr:'(없음)';
    kill(sk2); cleanup('me');
    o.두번은없다=names('me');

    /* ── 본드래곤 — 공체를 깎으며 반복 부활, 깎을 게 없으면 실패 ── */
    reset();
    let bd=put('me','본드래곤');
    const seq=[];
    for(let k=0;k<6;k++){
      const cur=S.me.board.find(u=>u&&u.name==='본드래곤');
      if(!cur)break;
      seq.push(`${cur.a}/${cur.insts[0].hp}`);
      kill(cur); cleanup('me');
    }
    o.용=seq.join(' → ')+(S.me.board.some(u=>u&&u.name==='본드래곤')?' (아직 살아 있음)':' (부활 실패)');

    /* ── 쉐도우 — 단말마로 상대를 빼앗고, 죽으면 원주인 무덤으로 ── */
    reset();
    put('ai','오아네스');
    const sh=put('me','쉐도우'); kill(sh); cleanup('me');
    o.탈취=[names('me'), names('ai')];
    const stolen=S.me.board.find(u=>u&&u.name==='오아네스');
    o.주인=stolen?stolen.own:'(안 빼앗김)';
    kill(stolen); cleanup('me');
    o.죽으면=[S.me.grave.slice(), S.ai.grave.slice()];

    /* ── 빼앗은 몸은 손으로 돌아갈 때도 원주인에게 ── */
    reset();
    put('ai','오아네스');
    const sh2=put('me','쉐도우'); kill(sh2); cleanup('me');
    const j=S.me.board.findIndex(u=>u&&u.name==='오아네스');
    toHand('me',j);
    o.바운스=[S.me.hand.join(','), S.ai.hand.join(',')];

    /* ── 출진 — 서큐버스(내 쪽은 반드시 고른다) ── */
    reset();
    put('ai','데스핸드'); put('ai','오아네스');     /* 1코 · 3코 → 3코 서큐버스는 1코만 */
    put('me','서큐버스');
    o.고르기=S.pick?S.pick.list.length:0;
    if(S.pick){ const t=S.pick.list[0], act=S.pick.act; S.pick=null; act(t.side,t.idx); }
    o.서큐=[names('me'), names('ai')];

    /* ── 출진 — 나이트메어 드로우 · 사이킥 페어리 인챈트 튜터 ── */
    reset(); S.me.deck=['데스핸드','구울','좀비'];
    put('me','나이트메어'); o.악몽=S.me.hand.length;
    reset(); S.me.deck=['데스핸드','오닉스','구울'];
    put('me','사이킥 페어리'); o.요정=S.me.hand.join(',');

    /* ── 출진 — 네크로맨서가 단말마를 모두 복제 ── */
    reset();
    put('me','스켈톤'); put('me','좀비랫'); put('me','구울');   /* 구울은 단말마가 없다 */
    put('me','네크로맨서');
    o.복제=names('me');

    /* ── 포그위저드 — 아군 전체 면역(자기 제외) · 죽으면 풀린다 ── */
    reset();
    const g=put('me','구울'); const fw=put('me','포그위저드');
    o.아우라=[!!g.vaura, !!fw.vaura];
    const h0=g.insts[0].hp; hurtAll(g,5); o.면역=[h0,g.insts[0].hp];
    const w0=fw.insts[0].hp; hurtAll(fw,1); o.자기자신=[w0,fw.insts[0].hp];
    kill(fw); cleanup('me');
    const g2=S.me.board.find(u=>u&&u.name==='구울');
    o.풀림=!!(g2&&!g2.vaura);
    const h1=g2.insts[0].hp; hurtAll(g2,2); o.풀린뒤=[h1,g2.insts[0].hp];
    /* 면역이 걸린 동안 수호는 접혔다가 풀리면 돌아온다 */
    reset();
    const gu=put('me','스컬 기마병'); put('me','포그위저드');
    o.수호접힘=!!gu.g===false;
    kill(S.me.board.find(u=>u.name==='포그위저드')); cleanup('me');
    o.수호복구=!!S.me.board.find(u=>u&&u.name==='스컬 기마병').g;

    /* ── 다크조커 — 때릴 때마다 1 더 ── */
    reset();
    const dj=put('me','다크조커');
    o.조커=dj.extra;

    /* ── 해그 — 아군이 죽을 때마다 주문 하나 ── */
    reset();
    put('me','해그'); const v=put('me','구울'); kill(v); cleanup('me');
    o.해그=S.me.hand.slice();

    /* ── 어둠 주문 ── */
    /* 물구나무 해골 */
    reset(); const x=put('me','좀비');            /* 4/2 */
    darkMass('me','물구나무 해골');
    const x2=S.me.board.find(u=>u&&u.name==='좀비');
    o.물구나무=x2?`${x2.a}/${x2.insts[0].hp}`:'(사라짐)';
    /* 전염병 */
    reset(); put('me','가고일'); put('ai','오아네스');
    darkMass('me','전염병');
    o.전염병=[S.me.board[0]&&S.me.board[0].insts[0].hp, S.ai.board[0]&&S.ai.board[0].insts[0].hp];
    /* 블랙홀 */
    reset(); put('me','구울'); put('ai','오아네스');
    for(let k=0;k<4;k++){S.me.landPlayed=false;playLand('me','죽음의 늪');}
    darkMass('me','블랙홀');
    o.블랙홀=[names('me')||'(빔)', names('ai')||'(빔)', S.me.lands.length];
    /* 자폭 공격 — 오른쪽부터 1:1 */
    reset(); ['구울','좀비','고스트'].forEach(n=>put('me',n));
    ['데스핸드','오아네스'].forEach(n=>put('ai',n));
    darkMass('me','자폭 공격');
    o.자폭=[names('me')||'(빔)', names('ai')||'(빔)'];
    /* 몸통던지기 */
    reset(); put('me','구울'); put('me','좀비');   /* HP 3 + 2 = 5 → ×2 = 10 */
    put('ai','가고일');
    darkMass('me','몸통던지기');
    o.몸통=[names('me')||'(빔)', S.ai.board[0]?S.ai.board[0].insts[0].hp:'(파괴)'];
    /* 그림자야수 — 판 위 크리처 수만큼 */
    reset(); ['구울','좀비'].forEach(n=>put('me',n)); put('ai','가고일');
    o.야수값=dmgVal('me','그림자야수',S.ai.board[0]);
    /* 노화 */
    reset(); put('ai','가고일');
    o.노화모드=modeOf('노화');
    resolveOnFoe('me','노화',0);
    o.노화=S.ai.board[0].a;
    /* 해골 던지기 */
    /* ⚠ 숫자를 박지 않는다 — 희귀도가 바뀌면 카드의 공/체가 통째로 바뀐다(실제로 겪었다).
       던질 몸의 HP 를 **재 두고** 그 2배가 들어갔는지를 본다. */
    reset(); const tg=put('me','구울'); put('ai','가고일');
    o.던짐HP=tg.insts[0].hp;
    const gh0=S.ai.board[0].insts[0].hp;
    resolveOnFoe('me','해골 던지기',0);
    o.던지기=[names('me')||'(빔)', gh0, S.ai.board[0]?S.ai.board[0].insts[0].hp:0];
    /* 사신의 수확 — 지금이 아니라 다음 내 턴 시작에 */
    reset(); put('ai','가고일');
    resolveOnFoe('me','사신의 수확',0);
    o.표식=[!!S.ai.board[0].doom, names('ai')];
    S.turn=2; startTurn('me');
    o.수확=names('ai')||'(빔)';
    /* 생명 흡수 */
    reset(); S.me.hp=40; const lv=put('me','가고일');
    const lh=lv.insts[0].hp;
    resolveOnMine('me','생명 흡수',S.me.board.indexOf(lv));
    o.흡수=[40, lh, S.me.hp, names('me')||'(빔)'];
    /* 혼령 부활 — 무덤에서 */
    reset(); const dz=put('me','구울'); kill(dz); cleanup('me');
    o.무덤=S.me.grave.slice();
    resolveSummon('me','혼령 부활',0);
    o.부활=names('me')||'(빔)';
    /* 해골쌓기 — 죽은 수가 곧 HP */
    reset();
    ['구울','좀비','고스트'].forEach(n=>{ const u=put('me',n); kill(u); });
    cleanup('me');
    resolveSummon('me','해골쌓기',0);
    const tw=S.me.board.find(u=>u&&u.name==='해골탑');
    o.해골탑=tw?`${tw.a}/${tw.insts[0].hp} 수호 ${!!tw.g}`:'(안 나옴)';
    return o;});

  ok('단말마 = 카드 1장', R.드로우[0]===1&&R.드로우[1].join()==='좀비랫',
     `손 ${R.드로우[0]}장 · 무덤 [${R.드로우[1]}]`);
  /* ⚠ 부활은 **죽은 그 자리**다(성권 결정) — 수호 순서·왼쪽부터 공격 순서가 안 흔들린다 */
  ok('부활은 죽은 자리에', R.부활자리==='구울,스켈톤,좀비', R.부활자리);
  ok('부활은 1회뿐', R.부활1회===''&&R.두번은없다==='구울,좀비',
     `되살아난 몸의 단말마 "${R.부활1회}" · 두 번째 죽음 뒤 [${R.두번은없다}]`);
  ok('본드래곤 = 깎이며 부활', R.용==='5/5 → 4/4 → 3/3 → 2/2 → 1/1 (부활 실패)', R.용);
  ok('쉐도우 = 상대를 빼앗는다', R.탈취[0]==='오아네스'&&R.탈취[1]==='',
     `내 [${R.탈취[0]}] · 상대 [${R.탈취[1]}]`);
  ok('원주인을 기억한다', R.주인==='ai', R.주인);
  /* 성권 정정: 소멸하거나 손으로 돌아갈 때는 **원래 주인에게** 간다 */
  ok('죽으면 원주인 무덤으로', R.죽으면[0].join()==='쉐도우'&&R.죽으면[1].join()==='오아네스',
     `내 무덤 [${R.죽으면[0]}] · 상대 무덤 [${R.죽으면[1]}]`);
  ok('손으로도 원주인에게', R.바운스[0]===''&&R.바운스[1]==='오아네스',
     `내 손 [${R.바운스[0]}] · 상대 손 [${R.바운스[1]}]`);
  ok('서큐버스 = 싼 것만 후보', R.고르기===1&&R.서큐[0]==='서큐버스,데스핸드'&&R.서큐[1]==='오아네스',
     `후보 ${R.고르기}개 · 내 [${R.서큐[0]}] · 상대 [${R.서큐[1]}]`);
  ok('출진 = 카드 2장', R.악몽===2, `${R.악몽}장`);
  ok('출진 = 덱의 인챈트', R.요정==='오닉스', R.요정||'(못 가져옴)');
  ok('네크로맨서 = 단말마 복제', R.복제==='스켈톤,좀비랫,구울,네크로맨서,스켈톤,좀비랫', R.복제);
  ok('포그위저드 = 아군 면역', R.아우라[0]===true&&R.아우라[1]===false,
     `구울 ${R.아우라[0]} · 자기자신 ${R.아우라[1]}`);
  ok('면역은 HP 를 안 깎는다', R.면역[0]===R.면역[1], `${R.면역[0]}→${R.면역[1]}`);
  ok('위저드 자신은 안 받는다', R.자기자신[1]===R.자기자신[0]-1, `${R.자기자신[0]}→${R.자기자신[1]}`);
  ok('죽으면 면역이 풀린다', R.풀림&&R.풀린뒤[1]===R.풀린뒤[0]-2,
     `아우라 ${R.풀림} · ${R.풀린뒤[0]}→${R.풀린뒤[1]}`);
  /* 면역과 수호는 양립하지 않는다(용어집) — 아우라가 켜진 동안만 접었다가 되돌린다 */
  ok('면역 동안 수호는 접힌다', R.수호접힘===true&&R.수호복구===true,
     `아우라 중 수호 ${!R.수호접힘?'유지':'접힘'} · 풀린 뒤 ${R.수호복구?'복구':'유실'}`);
  ok('다크조커 = 추가 피해 1', R.조커===1, `+${R.조커}`);
  ok('해그 = 죽을 때마다 주문', R.해그.length===1&&/^해그의 /.test(R.해그[0]), R.해그.join(',')||'(없음)');

  ok('물구나무 해골 = 공체 교환', R.물구나무==='2/4', `좀비 4/2 → ${R.물구나무}`);
  ok('전염병 = 양쪽 HP 1', R.전염병[0]===1&&R.전염병[1]===1, R.전염병.join(' · '));
  ok('블랙홀 = 판과 내 지형', R.블랙홀[0]==='(빔)'&&R.블랙홀[1]==='(빔)'&&R.블랙홀[2]===2,
     `내 ${R.블랙홀[0]} · 상대 ${R.블랙홀[1]} · 지형 4→${R.블랙홀[2]}`);
  /* 오른쪽부터 1:1 — 내 3종 중 상대 수(2)만큼 터지고, 터진 수만큼 상대가 죽는다 */
  ok('자폭 공격 = 오른쪽부터 1:1', R.자폭[0]==='구울'&&R.자폭[1]==='(빔)',
     `내 [${R.자폭[0]}] · 상대 [${R.자폭[1]}]`);
  ok('몸통던지기 = HP 합 ×2', R.몸통[0]==='(빔)'&&R.몸통[1]==='(파괴)',
     `내 ${R.몸통[0]} · 가고일 ${R.몸통[1]} (HP 합 5 × 2 = 10)`);
  ok('그림자야수 = 판 위 수만큼', R.야수값===3, `${R.야수값} (내 2 + 상대 1)`);
  /* ⚠ 분류가 '광역' 이면 대상 없이 즉시 터진다 — 노화는 한 개체를 겨눈다 */
  ok('노화 = 대상을 고른다', R.노화모드==='target'&&R.노화===1, `${R.노화모드} · ATK ${R.노화}`);
  ok('해골 던지기 = 던진 몸의 2배',
     R.던지기[0]==='(빔)'&&R.던지기[2]===R.던지기[1]-R.던짐HP*2,
     `던진 몸 HP ${R.던짐HP} × 2 = ${R.던짐HP*2} → 대상 ${R.던지기[1]}→${R.던지기[2]} · 내 판 ${R.던지기[0]}`);
  ok('사신의 수확 = 다음 턴에', R.표식[0]===true&&R.표식[1]==='가고일'&&R.수확==='(빔)',
     `표식 ${R.표식[0]} · 그 자리엔 [${R.표식[1]}] · 내 턴 시작 뒤 [${R.수확}]`);
  ok('생명 흡수 = 그 HP 만큼', R.흡수[2]===R.흡수[0]+R.흡수[1]&&R.흡수[3]==='(빔)',
     `HP ${R.흡수[0]}→${R.흡수[2]} (갈아 넣은 몸 HP ${R.흡수[1]}) · 판 ${R.흡수[3]}`);
  ok('혼령 부활 = 무덤에서', R.무덤.join()==='구울'&&R.부활==='구울',
     `무덤 [${R.무덤}] → 판 [${R.부활}]`);
  ok('해골쌓기 = 죽은 수가 HP', R.해골탑==='0/3 수호 true', R.해골탑);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
