/* 방화범·화염술사 2·3단계 신규 7종 — 카드가 문구대로 도는가 + AI 가 똑똑하게 쓰는가
 *   node tools/test_arson.js
 *
 * 여기 있는 것들도 **엔진에 없던 동작**을 새로 요구했다.
 *   용암 쥐        : 죽을 때 카드를 뽑는다 (그전까지 소멸 효과는 몸·피해뿐)
 *   불의 샘        : 내 연소 크리처 전부를 **키운다**(회복이 아니라 최대치까지 오른다)
 *   불사조         : 죽으면 알로 남고 **내 턴 시작에 멀쩡한 몸으로 부화**한다
 *   충전식 화염구   : 충전이 **줄지 않고 늘어난다** — 조건이 맞는 턴 끝에 통째로 터진다
 *   화염 광신도     : 이미 써 버린 주문을 되찾는다 (소각 더미 자체가 새 개념)
 *   푸른 불꽃의 수호병 : 내 스펠의 자해 조항을 통째로 무시한다
 *   불씨정령       : 예산을 전부 공격력에 몰았다(3/1) — 낸 턴에 스스로 꺼진다
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

  /* ── 데이터 ─────────────────────────────────────────────── */
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const NEW=['용암 쥐','불의 샘','불사조의 알','충전식 화염구','화염 광신도','푸른 불꽃의 수호병'];
  ok('신규 6종이 풀에 있다', NEW.every(n=>pool[n]&&pool[n].copies===0),
     NEW.map(n=>`${n}(${pool[n]?pool[n].c+'코':'없음'})`).join(' · '));
  ok('불씨정령 = 공격 몰빵', pool['불씨정령'].a===3&&pool['불씨정령'].h===1,
     `${pool['불씨정령'].a}/${pool['불씨정령'].h} 연소 1 — 낸 턴 종료에 스스로 꺼진다`);
  ok('불사조 = 알 부활', /불사조의 알로 변한다/.test(pool['불사조'].kw)
     &&/불사조로 되돌아온다/.test(pool['불사조의 알'].kw),
     `${pool['불사조'].a}/${pool['불사조'].h} → 알 ${pool['불사조의 알'].a}/${pool['불사조의 알'].h} → 다시 불사조`);

  const foes=JSON.parse(fs.readFileSync(path.join(ROOT,'data','enemies.json'),'utf8')).list;
  const arson=foes.find(e=>e.id==='fire_arson'), karin=foes.find(e=>e.id==='fire_karin');
  const nm=(e,b)=>e.decks[b].map(x=>x[0]);
  const n23=(e,b)=>e.decks[b].reduce((s,x)=>s+x[1],0);
  ok('세 단계 모두 23장', [arson,karin].every(e=>[0,1,2].every(b=>n23(e,b)===23)),
     [0,1,2].map(b=>`${b+1}단계 방화범 ${n23(arson,b)} · 카린 ${n23(karin,b)}`).join(' | '));
  ok('방화범 단계 카드', nm(arson,1).includes('용암 쥐')&&nm(arson,1).includes('불의 샘')
     &&!nm(arson,1).includes('불씨정령')&&nm(arson,2).includes('불사조')
     &&!nm(arson,1).includes('불사조'),
     `2단계 +용암 쥐·불의 샘(불씨정령 대체) · 3단계 +불사조`);
  ok('카린 단계 카드', nm(karin,1).includes('충전식 화염구')&&nm(karin,1).includes('화염 광신도')
     &&nm(karin,2).includes('푸른 불꽃의 수호병')&&!nm(karin,1).includes('푸른 불꽃의 수호병'),
     `2단계 +화염구·광신도 · 3단계 +수호병`);
  ok('고정 덱에 강화 0장', [arson,karin].every(e=>[0,1,2].every(b=>
     nm(e,b).every(n=>!/^강화 /.test(n)))), '단계 상승을 새 카드로만 표현한다');

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  /* ── 동작 ───────────────────────────────────────────────── */
  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.me.deck=['검사','창병','석벽','돌덩이','가시병','기사'];
      S.me.burned=[];S.ai.burned=[];S.tide=null;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};
    const en=(pl,n)=>{const c=POOL[n];S[pl].board.push({name:n,kind:'en',v:c.v,charge:c.ch});};
    const mana=n=>{S.me.lands=Array(n).fill(0)
      .map(()=>({name:'심연',els:['dark','fire','water','nature','steel','earth','light'],
                 used:false,entering:false}));};

    // 용암 쥐 — 죽으면서 카드 1장
    reset(); put('me','용암 쥐');
    const h0=S.me.hand.length;
    S.me.board[0].insts[0].hp=0; cleanup('me');
    o.쥐={드로우:S.me.hand.length-h0, 판:S.me.board.filter(Boolean).length};

    // 불의 샘 — 내 연소 크리처만 HP +1, 최대치도 같이
    reset(); put('me','화염정령'); put('me','검사'); en('me','불의 샘');
    const s0=[hp('me',0),hp('me',1)];
    fireEnch('me','end');
    o.샘={전:s0, 후:[hp('me',0),hp('me',1)], 최대:S.me.board[0].insts[0].mh,
          충전:S.me.board.find(u=>u&&u.kind==='en').charge};

    // 불사조 — 죽으면 알, 내 턴 시작에 멀쩡한 몸으로
    reset(); put('me','검사'); put('me','불사조'); put('me','창병');
    S.me.board[1].insts[0].hp=0; cleanup('me');
    o.불사조={알:S.me.board[1]&&`${S.me.board[1].name} ${S.me.board[1].a}/${hp('me',1)}`,
              자리:S.me.board.map(u=>u.name).join(',')};
    S.turn=3; startTurn('me');
    const ph=S.me.board.find(u=>u&&u.name==='불사조');
    o.불사조.부화=ph?`${ph.a}/${ph.insts[0].hp}`:'없음';

    // 푸른 불꽃의 수호병 — 내 스펠 자해를 안 맞는다
    reset(); put('me','푸른 불꽃의 수호병'); put('me','화염정령');
    const g0=[hp('me',0),hp('me',1)];
    spellSelfDmg('me','파이어볼');
    o.수호병={전:g0, 후:[hp('me',0),hp('me',1)]};

    // 화염 광신도 — 소각 더미에서 주문 하나를 되찾는다
    reset(); mana(9);
    pay('me','파이어 볼트'); pay('me','섬광 계시'); pay('me','검사');  /* 크리처는 안 쌓인다 */
    o.더미=S.me.burned.slice();
    put('me','화염 광신도');
    o.광신도={손:S.me.hand.slice(), 남은더미:S.me.burned.length};
    reset(); put('me','화염 광신도');            /* 더미가 비면 아무 일 없다 */
    o.빈더미=S.me.hand.length;

    // 충전식 화염구 — 주문을 쓸수록 충전이 늘고, 판이 비면 터진다
    reset(); mana(9); en('me','충전식 화염구');
    const c0=S.me.board[0].charge;
    pay('me','파이어 볼트'); pay('me','섬광 계시');
    const c1=S.me.board[0].charge;
    put('ai','용암거인'); put('ai','검사');       /* 두꺼운 몸 — 죽어 버리면 피해량을 못 잰다 */
    put('me','검사');                            /* 내 몸이 있으면 안 터진다 */
    o.화염구={시작:c0, 주문2회:c1, 몸있음:fuseEnchants('me')};
    S.me.board=S.me.board.filter(u=>u&&u.kind==='en');
    const face0=S.ai.hp, wall0=hp('ai',0);
    o.화염구.터짐=fuseEnchants('me');
    o.화염구.얼굴=face0-S.ai.hp;
    o.화염구.적=wall0-hp('ai',0);
    o.화염구.남음=S.me.board.filter(Boolean).length;
    return o;
  });

  ok('용암 쥐 = 소멸 드로우', R.쥐.드로우===1&&R.쥐.판===0, `죽으면서 카드 ${R.쥐.드로우}장`);
  ok('불의 샘 = 연소만 +1', R.샘.후[0]===R.샘.전[0]+1&&R.샘.후[1]===R.샘.전[1]
     &&R.샘.최대===R.샘.후[0]&&R.샘.충전===4,
     `화염정령 ${R.샘.전[0]}→${R.샘.후[0]}(최대 ${R.샘.최대}) · 검사 ${R.샘.전[1]}→${R.샘.후[1]}`
     +` · 잔여 충전 ${R.샘.충전}`);
  ok('불사조 = 알로 남는다', /불사조의 알 0\/1/.test(R.불사조.알||'')
     &&R.불사조.자리==='검사,불사조의 알,창병',
     `${R.불사조.알} · 자리 유지 [${R.불사조.자리}]`);
  ok('알 = 내 턴에 부화', R.불사조.부화==='4/5', `턴 시작에 ${R.불사조.부화} 로 되돌아온다`);
  ok('수호병 = 내 스펠 면역', R.수호병.후[0]===R.수호병.전[0]&&R.수호병.후[1]===R.수호병.전[1]-4,
     `수호병 ${R.수호병.전[0]}→${R.수호병.후[0]} (그대로) · 화염정령 ${R.수호병.전[1]}→${R.수호병.후[1]}`);
  ok('소각 더미 = 주문만', R.더미.join()==='파이어 볼트,섬광 계시',
     `[${R.더미.join(' · ')}] — 크리처는 안 쌓인다`);
  ok('광신도 = 하나 되찾음', R.광신도.손.length===1&&R.더미.includes(R.광신도.손[0])
     &&R.광신도.남은더미===1,
     `${R.광신도.손[0]} 을(를) 손으로 · 남은 더미 ${R.광신도.남은더미}`);
  ok('더미가 비면 그냥 나온다', R.빈더미===0, '되찾을 게 없어도 소환은 된다');
  ok('화염구 = 충전이 늘어난다', R.화염구.시작===4&&R.화염구.주문2회===6,
     `충전 ${R.화염구.시작} → 주문 2장 뒤 ${R.화염구.주문2회}`);
  ok('내 몸이 있으면 안 터진다', R.화염구.몸있음===false, '조건은 **내 크리처가 하나도 없을 때**');
  ok('판이 비면 통째로 터진다', R.화염구.터짐&&R.화염구.얼굴===6&&R.화염구.적===6
     &&R.화염구.남음===0,
     `적 전체 ${R.화염구.적} · 상대 얼굴 ${R.화염구.얼굴} · 인챈트는 소멸`);

  /* ── AI ─────────────────────────────────────────────────── */
  const A=await p.evaluate(async()=>{
    SPEED=60; const o={};
    const setup=(hand,board,foe)=>{
      S.ai.hand=hand.slice(); S.ai.deck=[]; S.ai.board=[]; S.me.board=[]; S.ai.burned=[];
      S.ai.lands=Array(9).fill(0).map(()=>({name:'화산',els:['fire'],used:false,entering:false}));
      S.ai.landPlayed=true; S.over=false; S.ai.hp=60; S.me.hp=60;
      board.forEach(n=>{ const c=POOL[n];
        if(c.k==='en')S.ai.board.push({name:n,kind:'en',v:c.v,charge:c.ch});
        else placeCreature('ai',n,S.ai.board.length); });
      (foe||[]).forEach(n=>placeCreature('me',n,S.me.board.length));
    };
    /* 뇌관이 찼는데 판이 비어 있으면 **크리처를 안 낸다** — 한 마리만 놔도 조건이 깨진다 */
    setup(['화염 아귀','불씨정령'],['충전식 화염구'],[]);
    S.ai.board[0].charge=6;
    await aiTurn();
    o.보류={손:S.ai.hand.length, 크리처:S.ai.board.filter(u=>u&&u.kind==='cr').length};
    /* 뇌관이 얹혀 있으면 파이어볼로 **제 판까지 비운다** — 평소라면 아까워서 안 쏠 상황 */
    setup(['파이어볼'],['충전식 화염구','화염 아귀'],['검사','검사','검사']);
    S.ai.board[0].charge=6;
    await aiTurn();
    o.자폭={손:S.ai.hand.length, 크리처:S.ai.board.filter(u=>u&&u.kind==='cr').length,
            내판:S.me.board.filter(Boolean).length};
    /* 뇌관이 없으면 예전 그대로 — 제 화염 아귀를 태우면서까지 쏘지 않는다 */
    setup(['파이어볼'],['화염 아귀'],['석벽','석벽','석벽']);
    await aiTurn();
    o.평소={손:S.ai.hand.length};
    /* 수호병은 파이어볼에 안 맞으므로 '잃는 몸' 으로 세지 않는다 → 그냥 쏜다 */
    setup(['파이어볼'],['푸른 불꽃의 수호병'],['검사','검사','검사']);
    await aiTurn();
    o.면역={손:S.ai.hand.length, 수호병:S.ai.board[0]&&S.ai.board[0].insts[0].hp,
            내판:S.me.board.filter(Boolean).length};
    return o;
  });
  ok('AI — 뇌관 앞에선 안 깐다', A.보류.손===2&&A.보류.크리처===0,
     `손에 크리처 ${A.보류.손}장을 쥔 채 턴을 넘긴다 (판 ${A.보류.크리처}종)`);
  ok('AI — 뇌관 위해 제 판도 태운다', A.자폭.손===0&&A.자폭.크리처===0&&A.자폭.내판===0,
     '파이어볼로 양쪽을 다 지우고 터뜨릴 준비를 마친다');
  ok('AI — 뇌관 없으면 아낀다', A.평소.손===1, '제 화염 아귀를 태우면서까지 쏘지 않는다');
  ok('AI — 면역은 손해가 아니다', A.면역.손===0&&A.면역.수호병===4&&A.면역.내판===0,
     `수호병 HP ${A.면역.수호병} 그대로 · 상대 판만 지웠다`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
