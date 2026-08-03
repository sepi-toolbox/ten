/* 물 덱 개편 1단계 — 지형 7종과 새 장치 셋
 *   node tools/test_water.js
 *
 * 여기서 엔진이 새로 배운 것:
 *   추가 지형(인어 기둥) : **턴당 지형 1장 제한을 안 먹는다.** 대신 자원 2를 내고 놓는다.
 *   소멸 지형(수정구)   : 스펠이 만들어 내고, 내 턴 시작마다 수명이 줄어 사라진다.
 *   턴 종료 지형        : landStart(턴 시작)의 짝인 landEnd — 호수 유적 · 바닷속 풍경.
 *   면역               : HP 가 **아예** 줄지 않는다. 가호(1회)와 달리 끝이 없고, 수호와 양립 못 한다.
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.ai.lands=[];S.me.deck=['검사','창병','석벽','돌덩이','가시병','기사'];
      S.me.landPlayed=false;S.dead=0;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};

    /* 새 지형 7종이 데이터에 있는가 */
    o.지형=['파도 지대','폭포','설원 지대','호수 유적','바닷속 풍경','인어 기둥','수정구']
      .map(n=>LANDS[n]?`${n}${LANDS[n].sp?'(특수)':''}${LANDS[n].extra?'(추가)':''}`
                       +`${LANDS[n].temp?'(소멸)':''}${LANDS[n].r?'·'+LANDS[n].r:''}`:`${n}없음`);

    /* ── 추가 지형 — 지형을 이미 놓았어도 낼 수 있다. 대신 자원 2 */
    reset();
    playLand('me','파도 지대'); playLand('me','폭포');      /* 둘째는 막힌다 */
    o.추가={한장:S.me.lands.length};
    reset(); ['파도 지대','폭포','설원 지대'].forEach(n=>{S.me.landPlayed=false;playLand('me',n);});
    S.me.landPlayed=true;                                  /* 이번 턴 지형은 이미 놓았다 */
    const m0=manaLeft('me');
    o.추가.막힘=whyNotPlayable('폭포');
    o.추가.가능=whyNotPlayable('인어 기둥');
    playLand('me','인어 기둥');
    o.추가.뒤={지형:S.me.lands.length, 마나:manaLeft('me'), 전:m0};
    /* 자원이 모자라면 못 놓는다 */
    reset(); S.me.landPlayed=false; playLand('me','파도 지대');
    S.me.landPlayed=true;
    o.추가.모자람=whyNotPlayable('인어 기둥');

    /* ── 소멸 지형 — 두 번의 내 턴 시작을 못 넘긴다 */
    reset(); putLand('me','수정구',{used:true}); putLand('me','수정구',{used:true});
    o.소멸={생성:S.me.lands.length, 첫턴마나:manaLeft('me')};
    S.turn=2; startTurn('me');
    o.소멸.한턴뒤={지형:S.me.lands.length, 마나:manaLeft('me')};
    S.turn=3; startTurn('me');
    o.소멸.두턴뒤=S.me.lands.length;

    /* ── 턴 종료 지형 */
    reset(); putLand('me','호수 유적'); put('me','검사');
    const h0=hp('me',0);
    o.유적={마나:manaLeft('me'), 전:h0};
    landEnd('me');
    o.유적.후=hp('me',0); o.유적.최대=S.me.board[0].insts[0].mh;
    reset(); putLand('me','바닷속 풍경');
    const d0=S.me.hand.length;
    landEnd('me');
    o.풍경={마나:manaLeft('me'), 드로우:S.me.hand.length-d0};

    /* ── 면역 — HP 가 아예 줄지 않고, 수호가 풀린다 */
    reset(); put('me','올렝');                              /* 수호 크리처 */
    const u=S.me.board[0];
    o.면역={수호전:!!u.g, 전:hp('me',0)};
    grantVeil(u);
    o.면역.수호후=!!u.g;
    hurt(u,u.insts[0],99); hurtRaw(u,u.insts[0],99); hurtAll(u,99);
    o.면역.후=hp('me',0);
    /* 부여 경로(규칙문)도 같은 장치를 쓴다 */
    o.면역.부여=grantOf('아군 하나에게 면역 부여').veil;
    return o;
  });

  ok('새 지형 7종', R.지형.every(x=>!/없음/.test(x)), R.지형.join(' · '));
  ok('지형은 턴당 한 장', R.추가.한장===1&&/이미 놓았다/.test(R.추가.막힘), R.추가.막힘);
  ok('추가 지형은 그 위에 더', R.추가.가능===null&&R.추가.뒤.지형===4
     &&R.추가.뒤.마나===R.추가.뒤.전-2+1,
     `지형 3장 + 인어 기둥 = ${R.추가.뒤.지형}장 · 마나 ${R.추가.뒤.전}→${R.추가.뒤.마나}`
     +' (자원 2 내고 자기 자원 1을 얹는다)');
  ok('자원 없으면 못 놓는다', /모자란다/.test(R.추가.모자람||''), R.추가.모자람);
  ok('소멸 지형 = 한 턴만', R.소멸.생성===2&&R.소멸.첫턴마나===0
     &&R.소멸.한턴뒤.지형===2&&R.소멸.한턴뒤.마나===2&&R.소멸.두턴뒤===0,
     `만든 턴 마나 ${R.소멸.첫턴마나} → 다음 턴 ${R.소멸.한턴뒤.마나} → 그 다음 턴 ${R.소멸.두턴뒤}장`);
  ok('호수 유적 = 자원 0 · HP +1', R.유적.마나===0&&R.유적.후===R.유적.전+1
     &&R.유적.최대===R.유적.후,
     `마나 ${R.유적.마나} · 검사 HP ${R.유적.전}→${R.유적.후}(최대 ${R.유적.최대})`);
  ok('바닷속 풍경 = 자원 0 · 1장', R.풍경.마나===0&&R.풍경.드로우===1,
     `마나 ${R.풍경.마나} · 턴 종료에 ${R.풍경.드로우}장`);
  ok('면역 = HP 가 안 준다', R.면역.후===R.면역.전&&R.면역.부여===true,
     `99 피해 세 번(hurt·hurtRaw·hurtAll)에도 HP ${R.면역.전} 그대로 · 부여 판정 ${R.면역.부여}`);
  ok('면역은 수호를 푼다', R.면역.수호전===true&&R.면역.수호후===false,
     '둘 다 두면 못 뚫는 벽이 된다');

  /* ── 2단계 — 크리처 27종 ─────────────────────────────────── */
  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  const OLD=['여울정령','파도술사','산호방벽','조수술사','해무령','해류지기','심해수호',
             '심연룡','만조의 수호자','소용돌이 정령','해신'];
  ok('옛 물 크리처 전멸', OLD.every(n=>!pool[n]), `${OLD.length}종 통째로 지웠다`);
  const NEW=['슬라임','피라냐','가버그','전기 해파리','닉시','운디네','워터리퍼','올렝',
             '세이렌','얼음 슬라임','오아네스','인어 전사','상어 인간','리자드 마술사','자르젤',
             '리자드 전사','인어 마술사','해마 기병','물의 정령','마인드 플레어','켈피',
             '바다 공룡','스킬라','폭풍의 정령','크라켄','시 서펜트','여왕의 가신'];
  /* ⚠ 시작 덱은 **커먼만** 싣는다 — 레어·언커먼은 카드 풀에만 둔다(원정 보상으로 얻는다) */
  const deck=JSON.parse(fs.readFileSync(path.join(ROOT,'data','decks.json'),'utf8')).water;
  const nonCommon=deck.cards.filter(([n])=>pool[n]&&pool[n].k==='cr'&&pool[n].r);
  ok('시작 덱 크리처는 커먼만', nonCommon.length===0,
     nonCommon.length?`섞임: ${nonCommon.map(x=>x[0]).join(', ')}`
       :`크리처 ${deck.cards.filter(([n])=>pool[n].k==='cr').length}종 전부 커먼`);
  ok('새 물 크리처 27종', NEW.every(n=>pool[n]&&pool[n].el==='water'),
     NEW.filter(n=>!pool[n]).join(',')||`전부 등재 (덱 수록 ${NEW.filter(n=>pool[n].copies>0).length}종)`);
  /* 소환체는 이제 **진짜 카드**다 — 토큰이 아니라서 바운스로 손에 잡힌다 */
  ok('소환체가 진짜 카드', ['불꽃 병사','새싹','조립 병기','부름의 망령','망자','여왕의 가신','물거품']
     .every(n=>pool[n]&&pool[n].copies===0),
     '불꽃 병사 · 새싹 · 조립 병기 · 부름의 망령 · 망자 · 여왕의 가신 · 물거품');

  const W=await p.evaluate(async()=>{
    SPEED=60; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];S.ai.hand=[];
      S.me.lands=[];S.ai.lands=[];S.me.deck=['심해','검사','창병'];S.ai.deck=[];
      S.dead=0;S.tide=null;S.mind=null;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const mana=n=>{S.me.lands=Array(n).fill(0)
      .map(()=>({name:'심해',els:['water'],used:false,entering:false}));};
    const names=pl=>S[pl].board.filter(Boolean).map(u=>u.name);

    reset(); put('me','운디네'); o.운디네=S.me.hand.slice();

    /* 상어 인간 — 상대에 수호가 서 있으면 낸 값을 그 자리에서 돌려받는다 */
    reset(); mana(3); put('ai','올렝'); pay('me','상어 인간');
    const paid=manaLeft('me'); put('me','상어 인간');
    o.상어={지불후:paid, 환급후:manaLeft('me')};
    reset(); mana(3); pay('me','상어 인간');       /* 수호가 없으면 환급 없음 */
    const paid2=manaLeft('me'); put('me','상어 인간');
    o.상어.수호없음={지불후:paid2, 뒤:manaLeft('me')};

    reset(); put('me','피라냐'); put('me','스킬라'); put('me','피라냐');
    o.스킬라=names('me');

    /* 크라켄 — 제 값보다 싼 몸을 양쪽 다 손으로 */
    reset(); ['피라냐','오아네스','바다 공룡'].forEach(n=>put('me',n));
    put('ai','닉시'); put('ai','크라켄');
    put('me','크라켄');
    o.크라켄={내판:names('me'), 상대판:names('ai'),
              내손:S.me.hand.slice(), 상대손:S.ai.hand.slice()};

    /* 마인드 플레어 — 인쇄된 몸으로. 받은 피해는 남지만 죽지는 않는다 */
    reset(); put('me','인어 마술사');
    const t=S.me.board[0];
    t.a+=5; t.insts[0].mh=8; t.insts[0].hp=1; t.veil=true; t.burn=3;
    put('ai','마인드 플레어');
    const w=S.me.board[0];
    o.마인드={몸:`${w.a}/${w.insts[0].hp}`, 최대:w.insts[0].mh, 면역:!!w.veil, 연소:w.burn||0};

    /* 연합 — 판 위 동명 크리처 수만큼 연타 */
    reset(); ['리자드 전사','리자드 전사','리자드 전사'].forEach(n=>put('me',n));
    const f0=S.ai.hp; await resolveAttacks('me'); o.연합=f0-S.ai.hp;
    reset(); ['리자드 전사','리자드 전사'].forEach(n=>put('me',n));
    const f2=S.ai.hp; await resolveAttacks('me'); o.연합둘=f2-S.ai.hp;
    reset(); put('me','리자드 전사');
    const f1=S.ai.hp; await resolveAttacks('me'); o.연합혼자=f1-S.ai.hp;

    /* 시 서펜트 — 내 턴 끝에 제일 싼 상대를 손으로 */
    reset(); put('me','시 서펜트'); ['바다 공룡','피라냐'].forEach(n=>put('ai',n));
    endStep('me');
    o.서펜트={상대판:names('ai'), 상대손:S.ai.hand.slice()};

    /* 세이렌 — 양쪽 스펠 모두 안 통한다 */
    reset(); put('me','세이렌'); put('me','바다 공룡');
    const h0=[S.me.board[0].insts[0].hp,S.me.board[1].insts[0].hp];
    spellSelfDmg('me','파이어볼');
    o.세이렌={전:h0, 후:[S.me.board[0].insts[0].hp,S.me.board[1].insts[0].hp]};

    /* 인어 마술사 = 주문마다 +1/+1 · 리자드 마술사 = 지형 1장 되돌림 */
    reset(); put('me','인어 마술사');
    const im=S.me.board[0], b0=`${im.a}/${im.insts[0].hp}`;
    onCast('me','조류 읽기');
    o.인어={전:b0, 후:`${im.a}/${im.insts[0].hp}`};
    reset(); S.me.lands=Array(4).fill(0)
      .map(()=>({name:'심해',els:['water'],used:true,entering:false}));
    put('me','리자드 마술사');
    const m0=manaLeft('me'); onCast('me','조류 읽기');
    o.리자드={전:m0, 후:manaLeft('me')};

    /* 소환체가 토큰이 아니라 진짜 카드로 나온다 */
    reset(); resolveSummon('me','불의 군단',0);
    o.군단=S.me.board.filter(Boolean).map(u=>`${u.name}${u.token?'(토큰)':''}`);
    return o;
  });

  ok('운디네 = 지형 드로우', W.운디네.join()==='심해', `덱에서 ${W.운디네.join()} 을(를) 손으로`);
  ok('상어 인간 = 비용 환급', W.상어.지불후===0&&W.상어.환급후===3
     &&W.상어.수호없음.지불후===0&&W.상어.수호없음.뒤===0,
     `상대 수호 O: ${W.상어.지불후}→${W.상어.환급후} · X: ${W.상어.수호없음.지불후}→${W.상어.수호없음.뒤}`);
  ok('스킬라 = 양옆에 가신', W.스킬라.join()==='피라냐,여왕의 가신,스킬라,여왕의 가신,피라냐',
     W.스킬라.join(' · '));
  ok('크라켄 = 양쪽 되감기', W.크라켄.내판.join()==='크라켄'&&W.크라켄.상대판.join()==='크라켄'
     &&W.크라켄.내손.length===3&&W.크라켄.상대손.join()==='닉시',
     `내 판 [${W.크라켄.내판}] 손 [${W.크라켄.내손}] · 상대 판 [${W.크라켄.상대판}] 손 [${W.크라켄.상대손}]`);
  ok('마인드 플레어 = 인쇄값', W.마인드.몸==='2/1'&&W.마인드.최대===2
     &&!W.마인드.면역&&W.마인드.연소===0,
     `7/1(최대 8 · 면역 · 연소 3) → ${W.마인드.몸}(최대 ${W.마인드.최대}) · 효과 전부 사라짐`);
  /* 연합 — **같은 이름의 아군이 모두 한 번씩 따라 친다.** 따라 친 공격은 다시 연합을 안 부른다.
     셋: 정규 3 + 따라 6 = 9회 × 3 = 27 · 둘: 2 + 2 = 4회 × 3 = 12 · 혼자면 따라올 몸이 없다. */
  ok('연합 = 동명이 따라 친다', W.연합===27&&W.연합둘===12&&W.연합혼자===3,
     `셋 ${W.연합} · 둘 ${W.연합둘} · 혼자 ${W.연합혼자}`);
  ok('시 서펜트 = 싼 것부터', W.서펜트.상대판.join()==='바다 공룡'&&W.서펜트.상대손.join()==='피라냐',
     `상대 판 [${W.서펜트.상대판}] · 손으로 [${W.서펜트.상대손}]`);
  ok('세이렌 = 스펠 무시', W.세이렌.후[0]===W.세이렌.전[0]&&W.세이렌.후[1]===W.세이렌.전[1]-4,
     `세이렌 ${W.세이렌.전[0]}→${W.세이렌.후[0]} · 바다 공룡 ${W.세이렌.전[1]}→${W.세이렌.후[1]}`);
  ok('인어 마술사 = 주문마다 +1/+1', W.인어.후==='3/3', `${W.인어.전} → ${W.인어.후}`);
  ok('리자드 마술사 = 지형 회수', W.리자드.전===0&&W.리자드.후===1,
     `뒤집힌 지형 4장 · 주문 한 번에 ${W.리자드.후}장 되돌아왔다`);
  ok('소환체는 토큰이 아니다', W.군단.join()==='불꽃 병사,불꽃 병사,불꽃 병사,불꽃 병사',
     W.군단.join(' · '));

  /* ── 2단계: 스펠 13종 · 인챈트 5종 ──────────────────────────
     ⚠ 옛 물 스펠/인챈트 9종(잔물결·환수·조류 읽기·역류·밀물의 부름·대해일·심연으로·
       해무·조수의 인장)은 **통째로 지웠다.** 되살아나면 여기서 잡힌다. */
  const S2=await p.evaluate(()=>{
    const o={};
    /* ⚠ 덱을 다시 채운다. 앞선 검사들이 뽑아 써서 바닥나 있으면 드로우가 조용히 0장이 되고,
       폭풍의 구슬·안개성 소환처럼 '뽑는' 카드가 카드 탓이 아닌 이유로 빨간불이 된다. */
    const setup=()=>{S.gen=(S.gen||0)+1;S.me.board=[];S.ai.board=[];S.me.hand=[];
      S.me.nospell={};S.me.noecho={};
      S.me.deck=[]; for(let i=0;i<30;i++)S.me.deck.push('피라냐');
      S.me.lands=[];for(let i=0;i<10;i++){S.me.landPlayed=false;playLand('me','심해');}
      S.me.lands.forEach(l=>{l.used=false;l.entering=false;});};
    const ench=(nm,i)=>{const c=POOL[nm];S.me.board[i]={name:nm,kind:'en',v:c.v,charge:c.ch};};
    o.옛카드=['잔물결','환수','조류 읽기','역류','밀물의 부름','대해일','심연으로','해무','조수의 인장']
             .filter(n=>POOL[n]);
    o.새카드=['수정구의 힘','얼음 방패','정신분열','허영','눈보라','복제 공격','환룡 강림',
             '환영검 소환','투명화','안개성 소환','인어의 노래','인어의 비명','폭풍우',
             '폭풍의 구슬','문어 다리','소원 거울','산호 검','인어의 하프'].filter(n=>!POOL[n]);
    o.내가만든카드=['심해 거인','해룡','대왕 문어'].filter(n=>POOL[n]);
    setup(); resolveInstant('me','수정구의 힘');
    const cry=S.me.lands.filter(l=>l.name==='수정구');
    o.수정구=`${cry.length}장 · 뒤집힘 ${cry.every(l=>l.used)} · 수명 ${(cry[0]||{}).temp}`;
    setup(); placeCreature('me','피라냐',0); resolveOnMine('me','얼음 방패',0);
    o.얼음방패=`${S.me.board[0].a}/${S.me.board[0].insts[0].hp} 수호=${S.me.board[0].g}`;
    setup(); placeCreature('me','피라냐',0); resolveOnMine('me','허영',0);
    o.허영=!!S.me.board[0].echo;
    setup(); placeCreature('me','올렝',0); resolveOnMine('me','투명화',0);
    o.투명화=`면역=${S.me.board[0].veil} 수호=${S.me.board[0].g}`;
    setup(); placeCreature('ai','피라냐',0); placeCreature('ai','오아네스',1);
    foeMassGrant('me','눈보라');
    o.눈보라=S.ai.board.map(u=>`${u.g?'수호':'-'}/${u.insts[0].hp}`).join(' ');
    setup(); placeCreature('ai','바다 공룡',0); resolveOnFoe('me','환영검 소환',0);
    o.환영검=S.ai.board.length?S.ai.board[0].insts[0].hp:'파괴';
    setup(); placeCreature('ai','바다 공룡',0);
    o.환룡빈칸=emptySlots('ai'); resolveOnFoe('me','환룡 강림',0);
    o.환룡=S.ai.board.length?S.ai.board[0].insts[0].hp:'파괴';
    setup(); placeCreature('me','피라냐',0); placeCreature('ai','오아네스',0);
    placeCreature('ai','바다 공룡',1); aoeSilence('me','인어의 노래');
    o.노래=[S.me.board[0].a,S.ai.board[0].a,S.ai.board[1].a].join('/');
    setup(); resolveInstant('me','안개성 소환');
    o.안개성=`뒤집힘 ${S.me.lands.filter(l=>l.used).length} · 손 ${S.me.hand.length}`;
    setup(); placeCreature('me','피라냐',0); S.me.hand=['바다 공룡'];
    resolveOnMine('me','복제 공격',0);
    o.복제=`${S.me.board[0].a}/${S.me.board[0].insts[0].hp}`;
    /* 주문 환류 — **딱 한 번** 돌아온다 */
    setup(); S.me.hand=['투명화']; onCast('me','투명화'); o.환류1=S.me.hand.length;
    S.me.hand=S.me.hand.filter(x=>x!=='투명화'); onCast('me','투명화'); o.환류2=S.me.hand.length;
    setup(); ench('폭풍의 구슬',0); fireEnch('me','end');
    o.구슬=`손 ${S.me.hand.length} · 충전 ${(S.me.board[0]||{}).charge}`;
    setup(); ench('문어 다리',0); placeCreature('me','전기 해파리',1);
    S.me.board[1].insts[0].hp=0; cleanup('me');
    o.문어=S.me.hand.join();
    setup(); ench('소원 거울',0); placeCreature('me','바다 공룡',1); placeCreature('me','피라냐',2);
    fireEnch('me','end');
    o.거울=S.me.board.filter(u=>u&&u.kind==='cr').map(u=>u.name).join();
    setup(); ench('산호 검',0); fireEnch('me','end'); o.산호=S.me.hand.join();
    setup(); ench('인어의 하프',0); placeCreature('me','바다 공룡',1);
    placeCreature('ai','오아네스',0); fireEnch('me','end');
    o.하프=`${S.me.board[1].a}/${S.ai.board[0].a}`;
    /* 시작 덱은 커먼만 · 5·6코가 통째로 비어 있다 */
    return o;
  });
  ok('옛 물 카드 전부 삭제', S2.옛카드.length===0, S2.옛카드.join(' ')||'0종 남음');
  ok('새 물 카드 18종 전부', S2.새카드.length===0, S2.새카드.join(' ')||'빠진 것 없음');
  /* ⚠ 승인 없이 만들었던 커먼 셋. 다시 생기면 여기서 잡힌다. */
  ok('멋대로 만든 카드 없음', S2.내가만든카드.length===0, S2.내가만든카드.join(' ')||'0종');
  ok('수정구의 힘', S2.수정구==='2장 · 뒤집힘 true · 수명 2', S2.수정구);
  ok('얼음 방패 = +0/+3 · 수호', S2.얼음방패==='1/5 수호=true', S2.얼음방패);
  ok('허영 = 환류 부여', S2.허영===true, `echo=${S2.허영}`);
  /* 면역은 수호와 양립하지 않는다 — 면역을 얻으면 수호가 풀린다 */
  ok('투명화 = 면역(수호 해제)', S2.투명화==='면역=true 수호=false', S2.투명화);
  ok('눈보라 = 수호 부여 · 1 피해', S2.눈보라==='수호/1 수호/3', S2.눈보라);
  ok('환영검 = 제 ATK 만큼', S2.환영검===0, `바다 공룡 6/6 → hp ${S2.환영검}`);
  ok('환룡 강림 = 빈 슬롯 수', S2.환룡빈칸===9&&S2.환룡===-3, `빈칸 ${S2.환룡빈칸} → hp ${S2.환룡}`);
  ok('인어의 노래 = ATK 2 이하 침묵', S2.노래==='0/4/6', S2.노래);
  ok('안개성 = 지형 뒤집고 드로우', S2.안개성==='뒤집힘 10 · 손 8', S2.안개성);
  ok('복제 공격 = 손 맨 왼쪽', S2.복제==='7/8', `피라냐 1/2 + 바다 공룡 6/6 = ${S2.복제}`);
  ok('주문 환류는 한 번만', S2.환류1===2&&S2.환류2===0, `1회차 손 ${S2.환류1} · 2회차 손 ${S2.환류2}`);
  ok('폭풍의 구슬', S2.구슬==='손 1 · 충전 1', S2.구슬);
  ok('문어 다리 = 환류 복제', S2.문어==='전기 해파리,전기 해파리', S2.문어);
  ok('소원 거울 = 최저 비용 복제', S2.거울==='바다 공룡,피라냐,피라냐', S2.거울);
  ok('산호 검 = 축복을 손으로', S2.산호==='산호의 축복', S2.산호||'(빈손)');
  ok('인어의 하프 = 양쪽 ATK −1', S2.하프==='5/3', S2.하프);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
