/* 인챈트(트리거형) 15종 + 스펠 부가 조항 전수 검사
 *   node tools/test_ench.js
 *
 * 왜 이 파일이 있나 — 한때 엔진이 **모든 인챈트를 얼굴 피해로만** 처리했다. 15종 중 12종이
 * 인쇄된 규칙과 달랐고, 어둠 덱의 'HP 지불' 5종은 대가를 아예 안 치렀다. 예산표가 무의미했다.
 * 여기서는 **카드에 찍힌 문구대로 도는가**만 본다.
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const ench=Object.entries(pool).filter(([,c])=>c.k==='en');

  ok('인챈트는 전부 트리거형', ench.every(([,c])=>c.tg&&c.fx),
     ench.map(([n,c])=>`${n}(${c.tg})`).join(' · '));
  /* 같은 효과를 가진 카드를 만들지 말 것 — 한때 2코 인챈트 넷이 전부 "HP +4" 로 똑같았다 */
  const sigs=ench.map(([,c])=>`${c.tg}/${c.fx}/${c.v}/${c.ch}`);
  ok('똑같은 인챈트 없음', new Set(sigs).size===sigs.length,
     `${sigs.length}종 중 서로 다른 조합 ${new Set(sigs).size}가지`);

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  /* 데이터의 fx 키가 엔진에 전부 있는가 — 새 인챈트를 만들고 한쪽만 고치면 조용히 안 돈다 */
  const fxs=await p.evaluate(()=>{
    const ks=Object.values(POOL).filter(c=>c.k==='en').map(c=>c.fx)
      .filter((x,i,a)=>a.indexOf(x)===i);
    return {miss:ks.filter(k=>!ENCHFX[k]), pend:[...FXPEND].filter(k=>ks.includes(k))};});
  ok('fx 키가 엔진에 있다', fxs.miss.length===0,
     fxs.miss.length?`엔진에 없음: ${fxs.miss}`:'전부 짝이 맞는다');
  /* ⚠ '없음' 과 '아직 안 만듦' 을 갈라 본다. 미구현은 FXPEND 에 **선언**해야 하고,
     선언된 것은 충전을 쓰지 않는다 — 반쯤 돌다 충전만 태우는 게 제일 나쁘다. */
  ok('미구현 fx 는 선언돼 있다', fxs.pend.join()==='scry', fxs.pend.join()||'없음');

  // ── 어둠 인챈트 3종 (호박 머리는 3단계)
  const dk=await p.evaluate(()=>{
    const r={}; const en=(pl,n)=>{const c=POOL[n];S[pl].board.push({name:n,kind:'en',v:c.v,charge:c.ch});};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.deck=['검사','창병','석벽'];};
    /* 오닉스 — 소환 트리거에 buffnew 를 그대로 쓴다(E3 → +1/+1) */
    reset(); en('me','오닉스');
    placeCreature('me','검사',0); onSummon('me','검사',0);
    const t=S.me.board.find(u=>u&&u.kind==='cr');
    r.오닉스=[t.a-POOL['검사'].a, t.insts[0].hp-POOL['검사'].h];
    /* 만월석 — 충전이 다하는 그 턴에 늑대인간 */
    reset(); en('me','만월석'); const mw=S.me.board[0];
    const seen=[]; for(let k=0;k<4;k++){ fireEnch('me','end');
      seen.push(S.me.board.filter(u=>u&&u.name==='늑대인간').length); }
    r.만월=seen.join(''); r.충전=mw.charge;
    /* 흑마도서 — 내 HP 가 줄면 아군 전체가 그만큼 커진다 */
    reset(); en('me','흑마도서');
    placeCreature('me','검사',1); placeCreature('me','창병',2);
    const a0=S.me.board[1].a; faceDmg('me',3);
    r.도서=[a0,S.me.board[1].a,S.me.board[2].a-POOL['창병'].a];
    /* ⚠ 제물(HP 지불)은 피해가 아니다 — 흑마도서가 울면 안 된다 */
    reset(); en('me','흑마도서'); placeCreature('me','검사',1);
    const b0=S.me.board[1].a;
    placeCreature('me','데스핸드',2); onSummon('me','데스핸드',2);   /* 제물 4 */
    r.제물=[S.me.board[1].a-b0, S.me.hp];
    return r;});
  ok('오닉스 = 소환마다 +1/+1', fxs.miss.length===0&&dk.오닉스.join()==='1,1', dk.오닉스.join('/'));
  ok('만월석 = 충전 끝에 늑대인간', dk.만월==='0011', `턴마다 늑대인간 수 [${dk.만월}] · 남은 충전 ${dk.충전}`);
  ok('흑마도서 = 잃은 만큼 아군 강화', dk.도서[1]===dk.도서[0]+3&&dk.도서[2]===3,
     `검사 ATK ${dk.도서[0]}→${dk.도서[1]} · 창병 +${dk.도서[2]}`);
  /* ⚠ 제물은 **피해가 아니라 비용**이라 faceDmg 를 안 지난다 — 흑마도서가 울면 안 된다 */
  ok('제물은 흑마도서를 안 울린다', dk.제물[0]===0&&dk.제물[1]===56,
     `검사 ATK +${dk.제물[0]} · 내 HP ${dk.제물[1]}`);

  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.me.deck=['검사','창병','석벽','돌덩이','가시병','기사'];S.tide=null;S.over=false;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    /* ⚠ 이름이 POOL 에 없으면 **여기서 이름을 밝히고 죽는다.** 예전엔 undefined.v 로
       터져서 "어느 카드가 사라졌는지" 를 스택만 보고는 알 수 없었다. */
    const en=(pl,n)=>{const c=POOL[n]; if(!c)throw new Error('POOL 에 없는 카드: '+n);
      S[pl].board.push({name:n,kind:'en',v:c.v,charge:c.ch});};
    const put0=(pl,n)=>{ if(!POOL[n])throw new Error('POOL 에 없는 카드: '+n); };
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};
    const mana=n=>{S.me.lands=Array(n).fill(0)
      .map(()=>({name:'죽음의 늪',els:['dark','fire','water','nature','steel','earth','light'],
                 used:false,entering:false}));};

    // ── 턴 종료 트리거 8종
    reset(); S.me.hp=30; en('me','성화'); fireEnch('me','end'); o.성화=S.me.hp-30;
    /* ⚠ 조수의 인장·불의 제단·해무는 물/불 전면 교체 때 지운 카드다. 지금 살아 있는
       인챈트로 같은 트리거를 잰다 — 폭풍의 구슬(드로우) · 인어의 하프(전체 ATK −1). */
    reset(); S.me.deck=['검사','창병','석벽']; en('me','폭풍의 구슬');
    const hd0=S.me.hand.length; fireEnch('me','end'); o.구슬=S.me.hand.length-hd0;
    reset(); put('me','검사'); put('me','창병'); en('me','소원 거울'); fireEnch('me','end');
    o.거울=S.me.board.filter(u=>u&&u.kind==='cr').map(u=>u.name).join(',');
    reset(); put('ai','창병'); const a0=S.ai.board[0].a; en('me','인어의 하프'); fireEnch('me','end');
    o.하프=[a0,S.ai.board[0].a];
    reset(); put('me','검사'); en('me','생명의 샘'); fireEnch('me','end');
    o.생명의샘=[S.me.board[0].a,hp('me',0)];
    reset(); put('me','검사'); en('me','병기고'); fireEnch('me','end'); o.병기고=S.me.board[0].hard;
    reset(); en('me','고대 제단'); fireEnch('me','end'); o.고대제단=60-S.ai.hp;
    // ── 조건 트리거
    /* ⚠ 흡혈 의식·피의 성배는 어둠 전면 교체 때 지운 카드다. 소멸 트리거는 지금 살아 있는
       악마의 석상(내 크리처가 소멸할 때마다 아군 전체 ATK +1)으로 잰다.
       ⚠ 'paid'(내가 HP 를 지불할 때마다) 트리거는 **지금 그 트리거를 쓰는 카드가 없다.**
         장치는 살아 있으니 어둠 3단계에서 다시 카드가 붙으면 그때 검사를 되살린다. */
    reset(); put('me','검사'); put('me','창병'); en('me','악마의 석상');
    const ga=S.me.board[1].a;
    S.me.board[0].insts[0].hp=0; cleanup('me');
    o.석상=[ga,S.me.board[0].a,POOL['악마의 석상'].v];   /* +v 만큼 오른다 */
    /* ⚠ 연쇄 발화도 불 전면 교체 때 지웠다. 소멸 트리거를 쓰는 카드는 지금
       악마의 석상 · 불사조의 깃털 둘뿐이다. */
    reset(); en('me','대지의 축복'); put('me','검사');
    const nu=S.me.board.find(u=>u.kind==='cr'); o.축복=[nu.a,nu.insts[0].hp];
    reset(); en('me','빛의 장막'); S.me.hp=30; put('me','검사'); o.장막=S.me.hp-30;
    reset(); en('me','전열 구축'); put('ai','창병'); o.전열=hp('ai',0);
    reset(); put('me','검사'); en('me','강철 의지');
    const w=S.me.board[0]; hurt(w,w.insts[0],2); o.강철의지=[w.insts[0].hp,w.insts[0].mh];

    // ── 스펠 부가 조항
    /* 피의 못·금단의 지식도 지운 카드다. 지금 HP 를 지불하는 주문은 동냥(1코, HP 8) 하나다. */
    reset(); mana(6); pay('me','동냥'); o.동냥=60-S.me.hp;
    reset(); put('ai','창병'); S.me.hp=40; resolveOnFoe('me','심판',0); o.심판=S.me.hp-40;
    /* 소이탄 — 즉시 파괴가 아니라 **상대 몸에 연소 5를 심는다**(대상이 반대편으로 뒤집혔다) */
    /* 소이탄은 지웠다 — 지금 같은 일을 하는 카드는 **작열 감옥**(2코, 상대에게 연소 5) */
    reset(); put('ai','창병'); resolveOnFoe('me','작열 감옥',0);
    o.감옥=[S.ai.board[0].burn, modeOf('작열 감옥')];
    reset(); put('ai','창병'); put('me','검사'); resolveOnFoe('me','포식',0);
    o.포식=[S.me.board[0].a,hp('me',0)];
    reset(); put('ai','강철수호'); const s0=hp('ai',0); resolveOnFoe('me','쐐기',0);
    o.쐐기=[s0,hp('ai',0)];
    reset(); put('ai','기사'); resolveOnFoe('me','가시덩쿨',0); o.덩쿨1=hp('ai',0);
    reset(); put('ai','기사'); ['검사','창병','석벽'].forEach(n=>put('me',n));
    resolveOnFoe('me','가시덩쿨',0); o.덩쿨3=hp('ai',0);
    reset(); let h0=S.me.hand.length; resolveInstant('me','폐허 발굴'); o.발굴0=S.me.hand.length-h0;
    reset(); put('me','검사'); h0=S.me.hand.length; resolveInstant('me','폐허 발굴');
    o.발굴1=S.me.hand.length-h0;
    reset(); put('me','기사'); h0=S.me.hand.length; resolveOnMine('me','용해',0);
    o.용해=[hp('me',0),S.me.hand.length-h0];
    /* 분신·연쇄 폭발·밀물의 부름은 전부 지운 카드다. 지금 살아 있는 것으로 잰다:
       화산 폭발(내 지형 하나를 부수고 연소 없는 몸에 12 나눠) · 지옥문 소환(아군을 갈아 소환) */
    reset(); put('me','헬하운드'); put('me','아제르');
    aoeSpread('me','화산 폭발',['me'],0);
    o.화산=[hp('me',0),hp('me',1)];              /* 아제르는 연소가 있어 안 맞는다 */
    reset(); put('me','검사'); put('me','창병'); resolveSummon('me','지옥문 소환',0);
    o.지옥문=S.me.board.filter(u=>u&&u.kind==='cr').map(u=>u.name).join(',');
    return o;
  });

  ok('턴 종료 트리거 7종', R.성화===4&&R.구슬===1&&/검사,검사|창병,창병/.test(R.거울)
     &&R.하프[1]===R.하프[0]-1
     &&R.생명의샘[0]===3&&R.병기고===1&&R.고대제단===2,
     `성화 +${R.성화} · 구슬 드로우 ${R.구슬} · 거울 [${R.거울}] · 하프 ATK ${R.하프[0]}→${R.하프[1]}`
     +` · 샘 ${R.생명의샘} · 병기고 경화${R.병기고} · 고대제단 ${R.고대제단}`);
  ok('소멸 트리거', R.석상[1]===R.석상[0]+R.석상[2],
     `악마의 석상 ATK ${R.석상[0]}→${R.석상[1]} (+${R.석상[2]})`);
  ok('소환 트리거', R.축복[0]===3&&R.축복[1]===6&&R.장막===3,
     `대지의 축복 ${R.축복.join('/')} · 빛의 장막 +${R.장막}`);
  ok('상대 소환 트리거', R.전열===1, `전열 구축 → 상대 창병 ${R.전열}`);
  ok('피해 트리거', R.강철의지[0]===R.강철의지[1], `강철 의지 — 맞자마자 ${R.강철의지[0]}/${R.강철의지[1]} 로 복구`);
  ok('HP 지불 스펠', R.동냥===8, `동냥 −${R.동냥}`);
  ok('요격 뒤 조항', R.심판===8&&R.포식[0]===4,
     `심판 +${R.심판} 회복 · 포식 버프 ${R.포식.join('/')}`);
  ok('상대에게 심는 부여', R.감옥[0]===5&&R.감옥[1]==='target',
     `작열 감옥 → 창병 연소 ${R.감옥[0]} · modeOf ${R.감옥[1]} (내 편이 아니라 상대를 겨눈다)`);
  ok('경화 무시', R.쐐기[1]===R.쐐기[0]-2, `강철수호(경화 1)에 ${R.쐐기[0]}→${R.쐐기[1]} — 2 그대로 들어갔다`);
  ok('조건부 피해', R.덩쿨3<R.덩쿨1, `가시덩쿨 — 내 개체 0일 때 ${R.덩쿨1} · 3개체일 때 ${R.덩쿨3}`);
  ok('조건부 드로우', R.발굴0===3&&R.발굴1===1, `폐허 발굴 — 크리처 0 → ${R.발굴0}장 · 1 → ${R.발굴1}장`);
  ok('자해 드로우', R.용해[1]===2&&R.용해[0]>0, `용해 — 기사 HP ${R.용해[0]} · ${R.용해[1]}장`);
  /* 화산 폭발 — '연소가 없는 모든 크리처' 만 맞는다. 아제르(연소 2)는 멀쩡해야 한다 */
  ok('화산 폭발 = 연소는 건너뜀', R.화산[0]<4&&R.화산[1]===5, `헬하운드 ${R.화산[0]} · 아제르 ${R.화산[1]}`);
  ok('지옥문 소환 = 아군을 간다', R.지옥문==='헬시온,헬시온', R.지옥문||'(안 나옴)');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
