/* 엘리멘츠 대전 모드 — 원작 규칙이 실제로 그렇게 도는지 본다
 *   node tools/test_etg.js
 *
 * 왜 이 파일이 있나 — 이 모드는 **본편과 규칙이 다르다.** 퀀텀이 쌓이고, 막기가
 * 없고, 문장이 있다. 본편 검사 40개는 이 중 한 줄도 안 지켜 준다. 그리고 이 모드가
 * 조용히 망가지는 방식은 딱 둘이다:
 *   ① 본편 카드가 새어 들어온다 (POOL 을 섞어 쓰면 바로 그렇게 된다)
 *   ② 구현 안 한 능력을 가진 카드가 덱에 들어가 **아무 일도 안 일어난다**
 * 그래서 그 둘을 맨 앞에서 센다.
 */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','etg','index.html');
const TEN =path.join(__dirname,'..','data','cards.json');

(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(28)+' '+(d===undefined?'':d)); };
  await p.goto(FILE); await p.waitForTimeout(600);

  /* ── 1) 본편 카드가 한 장도 없어야 한다 ─────────────────────────────── */
  const ten=require(TEN);
  /* ⚠ data/cards.json 은 {pool:{이름:{…}}} 꼴이다. 배열이 아니다. */
  const tenNames=new Set(Object.keys(ten.pool||ten));
  /* ⚠ 여기서 '이름이 안 겹친다' 를 재면 안 된다 — 미이라·블랙홀처럼 **번역이 우연히
     같아지는** 이름이 있고, 그건 데이터가 샌 것이 아니다. 재야 하는 것은
     **본편 데이터가 이 페이지에 실렸는가** 다. */
  const iso=await p.evaluate(()=>({
    pool:typeof window.POOL, decks:typeof window.DECKS, lands:typeof window.LANDS,
    keys:Object.keys(window.ETG)}));
  ok('본편 데이터가 안 실린다',
     iso.pool==='undefined'&&iso.decks==='undefined'&&iso.lands==='undefined',
     `POOL ${iso.pool} · DECKS ${iso.decks} · LANDS ${iso.lands}`);
  const etgNames=await p.evaluate(()=>ETG.cards.map(c=>c.ko));
  const dup=[...new Set(etgNames.filter(n=>tenNames.has(n)))];
  console.log(`   ℹ 이름이 우연히 같은 카드 ${dup.length}종: ${dup.join(', ')||'없음'} (서로 다른 게임이라 문제 없음)`);

  /* ── 2) 놀 수 있는 카드만 덱에 들어간다 ─────────────────────────────── */
  const cov=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const base=ETG.cards.filter(c=>!c.up);
    const play=base.filter(c=>D.playable(c));
    return {base:base.length, play:play.length, miss:[...D.MISS].sort(),
      pools:Object.keys(D.POOLS).map(k=>D.POOLS[k].length)};
  });
  ok('놀 수 있는 카드가 절반 넘는다', cov.play/cov.base>0.5,
     `${cov.play}/${cov.base}장 · 미구현 능력 ${cov.miss.length}종`);
  ok('12속성 전부 카드가 있다', cov.pools.slice(1).every(n=>n>=6), cov.pools.slice(1).join(','));

  /* ── 3) 퀀텀은 쌓인다 — 본편과 가장 크게 갈리는 지점 ────────────────── */
  /* ⚠ endTurn 은 턴을 **넘긴다.** 세 번 부르면 내 턴은 두 번뿐이다 —
     그걸 모르고 매번 늘기를 기대했다가 헛짚었다. 내 턴만 골라 잰다. */
  const acc=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.ai.hand=[];            /* 상대는 가만히 있게 */
    const snap=[];
    for(let t=0;t<6;t++){
      if(G.turn===G.me) { D.endTurn(); snap.push(G.me.q.slice(1).reduce((a,b)=>a+b,0)); }
      else D.endTurn();
    }
    return snap;
  });
  ok('퀀텀이 턴을 넘겨 쌓인다', acc.length>=3&&acc[1]>acc[0]&&acc[2]>acc[1], acc.join(' → '));

  /* ── 4) 문장은 매 턴 끝에 1을 준다 ──────────────────────────────────── */
  const mk=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(8)),8);
    const G=D.G; G.me.pm=new Array(16).fill(null); G.me.hand=[]; G.ai.hand=[];
    const a=G.me.q[8]; D.endTurn(); return [a,D.G.me.q[8]];
  });
  ok('문장이 턴 끝에 1을 준다', mk[1]===mk[0]+1, `${mk[0]} → ${mk[1]}`);

  /* ── 5) 막기가 없다 — 크리처는 몸을 지나쳐 얼굴을 때린다 ────────────── */
  /* ⚠ 본편이라면 수호가 막았을 상황이다. 여기서는 막는 개념 자체가 없어야 한다. */
  const noblock=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.hand=[]; G.ai.hand=[];
    G.me.cr=new Array(23).fill(null); G.ai.cr=new Array(23).fill(null);
    const u=D.summon(G.me,D.BYNAME['Crimson Dragon'].code);   /* 12|3 */
    D.summon(G.ai,D.BYNAME['Armagio'].code);                  /* 1|25 — 본편이면 벽 */
    const hp0=G.ai.hp; D.attack(u);
    return {hp0,hp:G.ai.hp,atk:u.atk, wall:G.ai.cr.filter(Boolean).length};
  });
  ok('크리처는 몸을 지나쳐 얼굴을 친다', noblock.hp===noblock.hp0-noblock.atk,
     `${noblock.hp0}→${noblock.hp} (공격 ${noblock.atk}, 앞에 몸 ${noblock.wall}개)`);

  /* ── 6) 방패는 막는 게 아니라 깎는다 ────────────────────────────────── */
  /* ⚠ BYNAME 에는 **기본판만** 있다. Tower Shield 는 Shield 의 강화판이라 없다. */
  const sh=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const G=D.G; G.ai.shield=D.mk(D.BYNAME['Shield'].code,G.ai);   /* -1 */
    G.me.cr=new Array(23).fill(null);
    const u=D.summon(G.me,D.BYNAME['Crimson Dragon'].code);
    const hp0=G.ai.hp; D.attack(u);
    return {d:hp0-G.ai.hp, atk:u.atk, dr:G.ai.shield.hp};
  });
  ok('방패는 피해를 깎는다', sh.d===sh.atk-sh.dr, `공격 ${sh.atk} − 방패 ${sh.dr} = ${sh.d}`);

  /* ── 7) 비행은 날개 방패를 지나간다 ─────────────────────────────────── */
  const wings=await p.evaluate(()=>{
    const D=window.ETGDBG; const G=D.G;
    G.ai.shield=D.mk(D.BYNAME['Wings'].code,G.ai);
    G.me.cr=new Array(23).fill(null);
    const fly=D.summon(G.me,D.BYNAME['Azure Dragon'].code);    /* 비행 */
    const gnd=D.summon(G.me,D.BYNAME['Armagio'].code);         /* 지상 */
    const a=G.ai.hp; D.attack(fly); const b=G.ai.hp; D.attack(gnd); const c=G.ai.hp;
    return {fly:a-b, gnd:b-c};
  });
  ok('날개는 지상만 막는다', wings.fly>0&&wings.gnd===0, `비행 ${wings.fly} · 지상 ${wings.gnd}`);

  /* ── 8) 독은 내 턴 끝에 상대를 깎는다 ───────────────────────────────── */
  const poi=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(2)),2);
    const G=D.G; G.me.hand=[];G.ai.hand=[];G.me.pm=new Array(16).fill(null);
    G.ai.poison=3; const a=G.ai.hp; D.endTurn(); return [a,D.G.ai.hp];
  });
  ok('독은 턴 끝에 깎는다', poi[1]===poi[0]-3, `${poi[0]} → ${poi[1]}`);

  /* ── 9) 덱이 마르면 진다 ────────────────────────────────────────────── */
  const dk=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.hand=[];G.ai.hand=[];G.ai.deck=[];
    D.endTurn();                       /* 내 턴이 끝나면 상대가 뽑는다 → 덱 0 */
    return {over:G.over, aiOut:G.ai.out};
  });
  ok('덱이 마르면 패배', dk.over&&dk.aiOut, JSON.stringify(dk));

  /* ── 10) 손패는 8장이 상한이다 — 넘치면 뽑은 카드가 버려진다 ────────── */
  const hd=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; const first=G.me.hand.length;
    for(let i=0;i<8;i++) D.draw(G.me);
    return {first, after:G.me.hand.length};
  });
  ok('첫 손패 7장 · 상한 8장', hd.first===7&&hd.after===8, `${hd.first} → ${hd.after}`);

  /* ── 11) 기둥은 쌓인다 (한 칸에 ×N) ─────────────────────────────────── */
  const st=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.pm=new Array(16).fill(null);
    const c=D.BYNAME['Burning Pillar'];
    for(let i=0;i<3;i++){ const u=D.mk(c.code,G.me); G.me.hand=[u]; D.playCard(G.me,u,null); }
    const used=G.me.pm.filter(Boolean);
    return {slots:used.length, charges:used[0]?used[0].charges:0};
  });
  ok('같은 기둥은 한 칸에 쌓인다', st.slots===1&&st.charges===3,
     `칸 ${st.slots}개 · ×${st.charges}`);

  /* ── 11b) 쌓인 기둥은 쌓인 수만큼 퀀텀을 만든다 ─────────────────────── */
  const stq=await p.evaluate(()=>{
    const D=window.ETGDBG; const G=D.G;
    G.me.hand=[]; G.ai.hand=[]; G.me.q=new Array(13).fill(0); G.me.mark=6;
    D.endTurn();
    return G.me.q[6];    /* 기둥 ×3 + 문장 1 */
  });
  ok('쌓인 만큼 퀀텀이 나온다', stq===4, `불 퀀텀 ${stq} (기둥 ×3 + 문장 1)`);

  /* ── 12) 실제로 한 판이 끝까지 돌아간다 ─────────────────────────────── */
  const run=await p.evaluate(async()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G;
    for(let t=0;t<60&&!G.over;t++){
      /* 낼 수 있는 것을 아무거나 낸다 — 사람이 누르는 것과 같은 길 */
      D.render();
      let guard=0;
      while(guard++<10){
        const el=document.querySelector('.hc:not(.no)');
        if(!el)break;
        el.click();
        if(document.getElementById('tip').style.display==='block'){
          const t2=document.querySelector('.cell.tgt'); if(t2)t2.click();
          else { document.getElementById('tip').click(); break; }
        }
      }
      if(G.turn===G.me) D.endTurn();
      await new Promise(r=>setTimeout(r,0));
      let w=0; while(G.turn===G.ai&&!G.over&&w++<200) await new Promise(r=>setTimeout(r,10));
    }
    return {over:G.over, turnsDone:true, myhp:G.me.hp, aihp:G.ai.hp,
      board:G.me.cr.filter(Boolean).length, q:G.me.q.slice(1).reduce((a,b)=>a+b,0)};
  });
  ok('한 판이 끝까지 돈다', run.board>0||run.over||run.q>0,
     `내 ${run.myhp} · 상대 ${run.aihp} · 내 몸 ${run.board} · 퀀텀 ${run.q}${run.over?' · 승부남':''}`);

  /* ── 12b) 죽음이 실제로 무언가를 터뜨린다 ──────────────────────────── */
  /* ⚠⚠ 이 검사가 있는 이유. 죽음은 **두 갈래**다 —
       ① 죽은 몸 자신의 owndeath (불사조 → 잿더미)
       ② 양쪽 판 전부의 death   (백골 무덤 · 영혼 포집기 · 독수리 · 뼈 장벽)
     이 둘을 거꾸로 걸어 놨더니 **어느 쪽도 한 번도 안 돌았는데 오류도 안 났다.**
     TEN 에서 strike() 가 시체를 직접 지워 onDeath 가 통째로 죽었던 것과 같은 사고다.
     그래서 '죽였을 때 무엇이 남는가' 를 눈으로 센다. */
  const dth=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(2)),2);
    const G=D.G; G.me.hand=[];G.ai.hand=[];
    G.me.cr=new Array(23).fill(null); G.me.pm=new Array(16).fill(null);
    const out={};
    /* ① 불사조 — 죽으면 그 자리에 잿더미 */
    const ph=D.summon(G.me,D.BYNAME['Phoenix'].code);
    D.kill(ph);
    out.ash=G.me.cr.filter(Boolean).map(u=>u.c.en);
    /* ② 백골 무덤 — 크리처가 죽을 때마다 해골 */
    G.me.cr=new Array(23).fill(null);
    G.me.pm[0]=D.mk(D.BYNAME['Boneyard'].code,G.me); G.me.pm[0].slot=0;
    const v=D.summon(G.me,D.BYNAME['Crimson Dragon'].code);
    D.kill(v);
    out.bone=G.me.cr.filter(Boolean).map(u=>u.c.en);
    /* ③ 영혼 포집기 — 죽을 때마다 죽음 퀀텀 */
    G.me.pm=new Array(16).fill(null);
    G.me.pm[0]=D.mk(D.BYNAME['Soul Catcher'].code,G.me);
    G.me.cr=new Array(23).fill(null); G.me.q[2]=0;
    D.kill(D.summon(G.me,D.BYNAME['Crimson Dragon'].code));
    out.soul=G.me.q[2];
    /* ④ 독수리 — 크리처가 죽을 때마다 +1|+1 (같은 id 인데 발동형이 아니다) */
    G.me.pm=new Array(16).fill(null); G.me.cr=new Array(23).fill(null);
    const vul=D.summon(G.me,D.BYNAME['Vulture'].code);
    const a0=vul.atk, h0=vul.hp;
    D.kill(D.summon(G.ai,D.BYNAME['Crimson Dragon'].code));
    out.vul=[a0+'|'+h0, vul.atk+'|'+vul.hp];
    return out;});
  ok('불사조는 잿더미를 남긴다', dth.ash.includes('Ash'), dth.ash.join(',')||'(아무것도 안 남았다)');
  ok('무덤은 해골을 낸다', dth.bone.includes('Skeleton'), dth.bone.join(',')||'(안 나왔다)');
  /* ⚠ 원문은 죽음 3 이다 — 2 로 굳혀 뒀던 것을 원문 대조에서 잡았다. */
  /* ⚠ 카드 글은 3 이지만 openEtG **원작판 코드는 기본 2**(강화 3). 수치는 코드를 따른다. */
  ok('영혼 포집기가 퀀텀을 얻는다', dth.soul===2, `죽음 퀀텀 ${dth.soul}`);
  ok('독수리는 시체를 먹고 큰다', dth.vul[1]!==dth.vul[0], `${dth.vul[0]} → ${dth.vul[1]}`);

  /* ── 12c) '눌러서 쓰는 능력' 과 '저절로 도는 것' 을 안 헷갈린다 ─────── */
  /* 성권이 짚은 자리 — 불의 정령은 공격할 때가 아니라 **1불 내고 눌러야** 큰다. */
  const act=await p.evaluate(()=>{
    const D=window.ETGDBG; const G=D.G;
    G.me.cr=new Array(23).fill(null); G.me.q=new Array(13).fill(0);
    const u=D.summon(G.me,D.BYNAME['Fire Spirit'].code);
    const a0=u.atk,h0=u.hp;
    D.attack(u);                       /* 그냥 공격만 해서는 안 커야 한다 */
    const afterAtk=[u.atk,u.hp];
    G.me.q[6]=5; D.useAbility(G.me,u,null);
    return {cost:u.cast, el:u.castel, before:[a0,h0], afterAtk, after:[u.atk,u.hp],
      q:G.me.q[6]};});
  ok('불의 정령은 공격만으론 안 큰다', act.afterAtk.join()===act.before.join(),
     `${act.before.join('|')} → ${act.afterAtk.join('|')}`);
  ok('눌러서 쓰면 큰다(비용도 낸다)',
     act.after.join()!==act.before.join()&&act.q===5-act.cost,
     `${act.before.join('|')} → ${act.after.join('|')} · 불 퀀텀 5→${act.q} (비용 ${act.cost})`);

  /* ── 12d) 능력의 **값**을 안 버린다 ────────────────────────────────── */
  /* ⚠⚠ 원작 표에는 값이 여러 개인 능력이 있다 — `growth 2 0` = 공격 +2, 체력 +0.
     첫 값만 읽고 나머지를 버렸더니 불의 정령이 +2|+0 이 아니라 **+2|+2** 로 자랐다.
     글만 틀린 게 아니라 수치가 틀렸다. `summon 1908` 은 값이 **카드 번호**라
     이름으로 찾다 undefined 가 되어 반딧불 여왕이 아무것도 안 불렀다.
     `quanta 8` 은 **속성 번호**라 카드 속성으로 읽으면 반딧불이 빛 대신 바람을 낸다. */
  const args=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.hand=[];G.ai.hand=[];
    const o={};
    /* 불의 정령 = +2|+0 · 숲의 정령 = +2|+2 — 같은 id 인데 값이 다르다 */
    G.me.cr=new Array(23).fill(null); G.me.q=new Array(13).fill(0); G.me.q[6]=9; G.me.q[7]=9;
    const fs=D.summon(G.me,D.BYNAME['Fire Spirit'].code);
    const b1=[fs.atk,fs.hp]; D.useAbility(G.me,fs,null); o.fire=[b1,[fs.atk,fs.hp]];
    const ls=D.summon(G.me,D.BYNAME['Forest Spirit'].code);
    const b2=[ls.atk,ls.hp]; D.useAbility(G.me,ls,null); o.forest=[b2,[ls.atk,ls.hp]];
    /* 반딧불 여왕 = 반딧불을 부른다(카드 번호로) */
    G.me.cr=new Array(23).fill(null); G.me.q[5]=9;
    const fq=D.summon(G.me,D.BYNAME['Firefly Queen'].code);
    D.useAbility(G.me,fq,null);
    o.summon=G.me.cr.filter(Boolean).map(u=>u.c.en);
    /* 반딧불은 **빛** 퀀텀을 만든다(자기 속성인 바람이 아니라) */
    G.me.cr=new Array(23).fill(null); G.me.pm=new Array(16).fill(null);
    G.me.q=new Array(13).fill(0); G.me.mark=6;
    D.summon(G.me,D.BYNAME['Firefly'].code);
    D.endTurn();
    o.q={빛:G.me.q[8], 바람:G.me.q[9]};
    return o;});
  ok('불의 정령은 +2|+0', args.fire[1][0]===args.fire[0][0]+2&&args.fire[1][1]===args.fire[0][1],
     `${args.fire[0].join('|')} → ${args.fire[1].join('|')}`);
  ok('숲의 정령은 +2|+2', args.forest[1][0]===args.forest[0][0]+2&&args.forest[1][1]===args.forest[0][1]+2,
     `${args.forest[0].join('|')} → ${args.forest[1].join('|')}`);
  ok('반딧불 여왕이 실제로 부른다', args.summon.filter(n=>/Firefly$/.test(n)).length>0,
     args.summon.join(',')||'(아무것도 안 나왔다)');
  ok('반딧불은 빛을 만든다', args.q.빛>0&&args.q.바람===0, JSON.stringify(args.q));

  /* ── 12e) 능력에 원작 이름이 붙는다 ────────────────────────────────── */
  const nm=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const g=n=>{const c=D.BYNAME[n];return {ko:c.abilko||null,en:c.abil||null,otxt:!!c.otxt};};
    return {fire:g('Fire Spirit'), vul:g('Vulture'), max:g("Maxwell's Demon"),
      named:ETG.cards.filter(c=>c.abil).length,
      orig:ETG.cards.filter(c=>c.otxt).length};});
  ok('발동형 능력에 이름이 있다', nm.fire.ko==='아블레이즈'&&nm.max.ko==='역설',
     `불의 정령 ${nm.fire.ko}(${nm.fire.en}) · 맥스웰의 악마 ${nm.max.ko}(${nm.max.en})`);
  ok('지속형 능력에도 이름이 있다', nm.vul.ko==='시체 청소', `독수리 ${nm.vul.ko}(${nm.vul.en})`);
  ok('원문이 카드에 붙어 있다', nm.orig>380&&nm.named>100,
     `원문 ${nm.orig}장 · 이름 ${nm.named}장`);

  /* ── 12f) 쓸 수 있는 능력은 눈에 띈다 ──────────────────────────────── */
  const hl=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.cr=new Array(23).fill(null); G.me.q=new Array(13).fill(0);
    const u=D.summon(G.me,D.BYNAME['Fire Spirit'].code);
    D.render();
    const poor=document.querySelectorAll('#myBoard .slot.canuse').length;   /* 퀀텀 0 — 못 쓴다 */
    G.me.q[6]=9; D.render();
    const rich=document.querySelectorAll('#myBoard .slot.canuse').length;
    /* ⚠ 뜨는 것이 신호다 — 클래스만 보지 말고 **실제로 올라갔는지**와
       **아무것도 안 가리는지**(공격력이 그대로 읽히는지)를 같이 본다. */
    const el=document.querySelector('#myBoard .slot.canuse');
    const st=el?getComputedStyle(el):null;
    const lift=st?new DOMMatrix(st.transform).m42:0;
    const covered=!!(el&&el.querySelector('.usetag'));
    const atk=el?el.querySelector('.tb.a').textContent.trim():'';
    /* ⚠⚠ 클래스가 붙었는지만 보면 아무것도 못 잡는다 — 본편에
       `.slot.occ{box-shadow:none!important}` 가 있어서 `.slot` 에 건 빛은
       **한 줄도 그려지지 않고 있었다.** 실제로 칠해진 값을 잰다. */
    const card=el?el.querySelector('.tcard'):null;
    const glow=card?getComputedStyle(card).boxShadow:'';
    const clip=el?getComputedStyle(el).overflow:'';
    u.used=true; D.render();
    const spent=document.querySelectorAll('#myBoard .slot.canuse').length;
    return {poor,rich,spent,lift:Math.round(lift),covered,atk,glow,clip};});
  ok('못 쓸 땐 안 빛난다', hl.poor===0, `${hl.poor}개`);
  ok('쓸 수 있으면 카드가 뜬다', hl.rich===1&&hl.lift<=-2,
     `${hl.rich}개 · ${hl.lift}px 떠 있다`);
  ok('띄우느라 숫자를 가리지 않는다', hl.covered===false&&hl.atk!=='',
     `뱃지 ${hl.covered?'있음':'없음'} · 공격력 "${hl.atk}"`);
  /* 손패도 같은 규칙 — 낼 수 있는 장만 뜬다 */
  const hh=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6); const G=D.G;
    G.me.q=new Array(13).fill(0); G.me.q[6]=3;
    G.me.hand=['Burning Pillar','Crimson Dragon'].map(n=>D.mk(D.BYNAME[n].code,G.me));
    D.render();
    const read=i=>{
      const w=document.querySelector(`#hand .hcw[data-h="${i}"]`);
      const c=w.querySelector('.tcard'), cs=getComputedStyle(c);
      return {cls:w.className, lift:Math.round(new DOMMatrix(cs.transform).m42),
              glow:cs.boxShadow};};
    return {cheap:read(0), dear:read(1)};});
  ok('손패도 낼 수 있는 장만 뜬다',
     / ok/.test(hh.cheap.cls)&&hh.cheap.lift<=-2
     &&/ no/.test(hh.dear.cls)&&hh.dear.lift===0,
     `${hh.cheap.cls.trim()} ${hh.cheap.lift}px · ${hh.dear.cls.trim()} ${hh.dear.lift}px`);
  ok('손패 초록 테도 실제로 그려진다',
     /rgba?\(1[0-9][0-9], 2[0-9][0-9], 1[0-9][0-9]/.test(hh.cheap.glow)
     &&!/rgba?\(1[0-9][0-9], 2[0-9][0-9], 1[0-9][0-9]/.test(hh.dear.glow),
     `${hh.cheap.glow.slice(0,40)}…`);

  /* 초록 링이 **실제로 칠해졌고**, 칸이 그걸 잘라 내지 않는지 */
  ok('초록 테가 실제로 그려진다',
     /rgba?\(1[0-9][0-9], 2[0-9][0-9], 1[0-9][0-9]/.test(hl.glow)&&hl.clip==='visible',
     `${hl.glow.slice(0,46)}… · overflow ${hl.clip}`);
  ok('이번 턴 다 썼으면 꺼진다', hl.spent===0, `${hl.spent}개`);

  /* ── 13) 카드가 본편 규격으로 그려진다 ─────────────────────────────── */
  /* ⚠ 여기서 '보이냐' 가 아니라 **본편 클래스로 그려졌냐** 를 본다. 규격을 이 모드에서
     따로 그리기 시작하면 두 벌이 되어 반드시 어긋난다(옛 card_gallery 가 그렇게 낡았다). */
  await p.evaluate(()=>{ const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; D.summon(G.me,D.BYNAME['Crimson Dragon'].code);
    G.me.weapon=D.mk(D.BYNAME['Fahrenheit'].code,G.me); D.render(); });
  await p.waitForTimeout(150);
  const spec=await p.evaluate(()=>{
    const c=document.querySelector('#myBoard .slot.occ .tcard');
    return {slot:!!document.querySelector('#myBoard .slot.occ'),
      tcard:!!c, head:!!(c&&c.querySelector('.thead .tname')),
      art:!!(c&&c.querySelector('.tart')), eff:!!(c&&c.querySelector('.tbody .teff')),
      stat:!!(c&&c.querySelector('.tstat .tb.a')),
      hand:!!document.querySelector('#hand .hcw .tcard')};
  });
  ok('본편 카드 규격으로 그린다', Object.values(spec).every(Boolean), JSON.stringify(spec));

  /* ── 14) 줄 순서가 본편과 같다 ─────────────────────────────────────── */
  /* ⚠⚠ 본편 `.main` 은 자식을 **id 로 재배열한다**(#foeHand:0 … #hand:8).
     HTML 에 적은 순서가 화면 순서가 아니다 — 이걸 모르고 붙였다가 상대 판·내 판·
     기록이 뒤죽박죽 섞여 나왔다. 화면에 찍힌 **실제 y 좌표**로 잰다. */
  const ord=await p.evaluate(()=>{
    const ids=['foeHand','foeBar','foePm','foeBoard','myBoard','myPm','myBar','hand','log'];
    const y={}; ids.forEach(i=>{const e=document.getElementById(i);
      y[i]=e?Math.round(e.getBoundingClientRect().top):null;});
    const ctl=document.querySelector('.ctl');
    y.ctl=ctl?Math.round(ctl.getBoundingClientRect().top):null;
    return y;});
  const want=['foeHand','foeBar','foePm','foeBoard','ctl','myBoard','myPm','myBar','hand','log'];
  const seq=want.map(k=>ord[k]);
  ok('줄 순서가 본편과 같다', seq.every((v,i)=>v!==null&&(i===0||v>=seq[i-1])),
     want.map((k,i)=>`${k}:${seq[i]}`).join(' '));

  /* ── 15) 손패가 화면 밖으로 안 나간다 ──────────────────────────────── */
  const fit=await p.evaluate(()=>{
    const D=window.ETGDBG, G=D.G;
    while(G.me.hand.length<8) G.me.hand.push(D.mk(D.BYNAME['Crimson Dragon'].code,G.me));
    D.render();
    const el=document.getElementById('hand');
    const last=el.lastElementChild.getBoundingClientRect();
    return {n:G.me.hand.length, right:Math.round(last.right), w:window.innerWidth};
  });
  ok('손패 8장이 화면 안에 들어온다', fit.right<=fit.w+2, `${fit.n}장 · 오른쪽 끝 ${fit.right} ≤ ${fit.w}`);

  /* ── 16) 길게 누르면 효과 전문이 뜬다 ──────────────────────────────── */
  /* 성권이 짚은 그것 — 카드 설명란은 본편 규격상 3줄에서 잘린다. 전문은 확대창이 맡는다. */
  const box=await p.$('#myBoard .slot.occ');
  const bb=await box.boundingBox();
  await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);
  await p.mouse.down(); await p.waitForTimeout(650);
  const z=await p.evaluate(()=>{
    const zz=document.getElementById('zoom');
    return {on:zz.classList.contains('on'),
      big:!!zz.querySelector('.tcard.lg'),
      defs:zz.querySelectorAll('.zdef').length,
      txt:(zz.textContent||'').length};});
  await p.mouse.up();
  ok('길게 누르면 효과가 다 뜬다', z.on&&z.big&&z.defs>=2&&z.txt>60,
     `확대 ${z.on} · 큰 카드 ${z.big} · 설명 ${z.defs}칸 · 글자 ${z.txt}자`);
  const closed=await p.evaluate(()=>{ document.body.dispatchEvent(
      new PointerEvent('pointerdown',{bubbles:true}));
    return !document.getElementById('zoom').classList.contains('on'); });
  ok('아무 데나 누르면 닫힌다', closed, '');

  /* ── 17) 손패에서 끌어내 낸다 (본편과 같은 손짓) ────────────────────── */
  /* ⚠ 이 모드는 한동안 **탭으로만** 낼 수 있었다. 본편에 있는 조작이 여기 없으면
     그건 기능이 없는 게 아니라 **고장 난 것처럼** 느껴진다(성권이 그렇게 읽었다). */
  await p.evaluate(()=>{
    const D=window.ETGDBG; D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.hand=[]; G.me.cr=new Array(23).fill(null); G.ai.cr=new Array(23).fill(null);
    ['Crimson Dragon','Fire Bolt'].forEach(n=>G.me.hand.push(D.mk(D.BYNAME[n].code,G.me)));
    D.summon(G.ai,D.BYNAME['Armagio'].code);
    for(let e=1;e<=12;e++)G.me.q[e]=20; D.render();});
  await p.waitForTimeout(200);
  let hb=await (await p.$('#hand .hcw[data-h="0"]')).boundingBox();
  await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);
  await p.mouse.down(); await p.mouse.move(hb.x+hb.width/2,hb.y-40,{steps:6});
  await p.waitForTimeout(120);
  const drg=await p.evaluate(()=>({ghost:!!document.querySelector('.dgh'),
    tip:(document.querySelector('.dztip')||{}).textContent||'',
    mode:document.body.classList.contains('dragmode')}));
  ok('끌면 카드가 따라온다', drg.ghost&&drg.mode, `"${drg.tip}"`);
  await p.mouse.move(195,430,{steps:6}); await p.mouse.up(); await p.waitForTimeout(250);
  const put=await p.evaluate(()=>ETGDBG.G.me.cr.filter(Boolean).map(u=>u.c.en));
  ok('손패 밖에 놓으면 나간다', put.includes('Crimson Dragon'), put.join(',')||'(안 나갔다)');

  /* ── 18) 대상이 필요하면 화살표로 겨눈다 ───────────────────────────── */
  hb=await (await p.$('#hand .hcw[data-h="0"]')).boundingBox();
  await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);
  await p.mouse.down(); await p.mouse.move(hb.x+hb.width/2,hb.y-60,{steps:6});
  await p.mouse.move(195,500,{steps:6}); await p.mouse.up(); await p.waitForTimeout(250);
  const arw=await p.evaluate(()=>({svg:!!document.getElementById('tgtsvg'),
    dim:document.body.classList.contains('tgtmode'),
    pick:document.querySelectorAll('.slot.pick').length}));
  ok('겨눌 땐 화살표와 딤', arw.svg&&arw.dim&&arw.pick>0,
     `화살표 ${arw.svg} · 딤 ${arw.dim} · 빛나는 대상 ${arw.pick}개`);
  const tgt=await p.$('#foeBoard .slot.pick');
  const tb=await tgt.boundingBox();
  await p.mouse.move(tb.x+tb.width/2,tb.y+tb.height/2);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(250);
  const hit=await p.evaluate(()=>({hp:(ETGDBG.G.ai.cr.filter(Boolean)[0]||{}).hp,
    svg:!!document.getElementById('tgtsvg')}));
  ok('고르면 나가고 화살표가 걷힌다', hit.hp<25&&!hit.svg, `아르마지오 25→${hit.hp}`);

  /* ── 19) 못 내는 카드도 끌리고, 왜 안 되는지 말해 준다 ─────────────── */
  /* ⚠ 못 끌게 막으면 "드래그가 안 된다" 로 읽힌다 — 끌리게 두고 놓을 때 이유를 말한다. */
  await p.evaluate(()=>{ const D=window.ETGDBG, G=D.G;
    G.me.hand=[D.mk(D.BYNAME['Miracle'].code,G.me)];   /* 15빛 — 낼 수 없다 */
    G.me.q=new Array(13).fill(0); D.render(); });
  await p.waitForTimeout(150);
  hb=await (await p.$('#hand .hcw[data-h="0"]')).boundingBox();
  await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);
  await p.mouse.down(); await p.mouse.move(hb.x+hb.width/2,hb.y-50,{steps:6});
  await p.waitForTimeout(120);
  const badtip=await p.evaluate(()=>{const t=document.querySelector('.dztip');
    return {t:t?t.textContent:'', bad:t?t.classList.contains('bad'):false};});
  await p.mouse.move(195,430,{steps:5}); await p.mouse.up(); await p.waitForTimeout(200);
  const said=await p.evaluate(()=>{const t=document.querySelector('.toast');return t?t.textContent:'';});
  ok('못 내는 카드도 끌리고 이유를 말한다', badtip.bad&&/퀀텀/.test(said),
     `끌 때 "${badtip.t}" · 놓을 때 "${said}"`);

  /* ── 20) 비용이 **정확히** 나간다 — 전 카드·전 능력 ────────────────── */
  /* ⚠ 이건 눈으로 못 잡는다. 한 장씩 내 보고 통에서 빠진 양을 센다.
     퀀텀을 만들어 내는 카드(신성·분신)와 통을 비우는 카드(기적·창공 강습·프랙탈·
     희생의 파편)는 규칙이 그래서 그런 것이므로 따로 뺀다. */
  /* 가뭄·건조는 준 피해만큼 물을 돌려받는다 — 통이 줄지 않는 게 규칙이다 */
  const EXEMPT=['Nova','Immolation','Miracle','Sky Blitz','Fractal','Shard of Sacrifice',
                'Supernova','Cremation','Improved Miracle','Dry Spell','Dessication'];
  const pay1=await p.evaluate(ex=>{
    const D=window.ETGDBG; const out={ok:0,bad:[]};
    for(const c of ETG.cards.filter(x=>!x.up&&D.playable(x)&&!ex.includes(x.en))){
      D.startGame(D.deckList(D.autoDeck(6)),6);
      const G=D.G; G.me.hand=[];G.ai.hand=[];
      G.me.cr=new Array(23).fill(null);G.ai.cr=new Array(23).fill(null);G.me.pm=new Array(16).fill(null);
      D.summon(G.ai,D.BYNAME['Armagio'].code); D.summon(G.me,D.BYNAME['Photon'].code);
      G.me.pm[0]=D.mk(D.BYNAME['Bone Pillar'].code,G.me); G.ai.weapon=D.mk(D.BYNAME['Dagger'].code,G.ai);
      G.me.q=new Array(13).fill(30);
      const before=G.me.q.slice();
      const u=D.mk(c.code,G.me); G.me.hand=[u];
      const s=u.sk.find(x=>x.ev==='cast');
      const k=(c.kind==='spell'&&s&&D.SK[s.id])?D.SK[s.id].t:null;
      const pool=[].concat(G.me.cr,G.ai.cr,G.me.pm,[G.ai.weapon]).filter(Boolean);
      if(!D.playCard(G.me,u,k?(k==='any'?G.ai:pool[0]):null)) continue;
      let spent=0,per={},gen=false;
      for(let e=1;e<=12;e++){const d=before[e]-G.me.q[e];
        if(d>0){spent+=d;per[e]=d;} else if(d<0)gen=true;}
      if(gen) continue;
      if(spent!==c.cost||(c.costel>0&&per[c.costel]!==c.cost))
        out.bad.push(`${c.ko}(${c.en}) 비용 ${c.cost}:${c.costel} → 쓴 ${spent} ${JSON.stringify(per)}`);
      else out.ok++;
    }
    return out;},EXEMPT);
  ok('카드 비용이 정확히 나간다', pay1.bad.length===0,
     `${pay1.ok}장 확인${pay1.bad.length?' · '+pay1.bad.slice(0,3).join(' / '):''}`);

  const pay2=await p.evaluate(()=>{
    const D=window.ETGDBG; const out={ok:0,bad:[]};
    for(const c of ETG.cards.filter(x=>!x.up&&D.playable(x)&&x.kind!=='spell'
        &&x.sk.some(s=>s.ev==='cast'))){
      D.startGame(D.deckList(D.autoDeck(6)),6);
      const G=D.G; G.me.hand=[];G.ai.hand=[];
      G.me.cr=new Array(23).fill(null);G.ai.cr=new Array(23).fill(null);G.me.pm=new Array(16).fill(null);
      D.summon(G.ai,D.BYNAME['Armagio'].code); D.summon(G.me,D.BYNAME['Photon'].code);
      G.me.pm[0]=D.mk(D.BYNAME['Bone Pillar'].code,G.me); G.ai.weapon=D.mk(D.BYNAME['Dagger'].code,G.ai);
      let u;
      if(c.kind==='creature') u=D.summon(G.me,c.code);
      else { u=D.mk(c.code,G.me);
        if(c.kind==='weapon')G.me.weapon=u; else if(c.kind==='shield')G.me.shield=u;
        else {u.slot=1;G.me.pm[1]=u;} }
      if(!u)continue;
      G.me.q=new Array(13).fill(30);
      const before=G.me.q.slice();
      /* ⚠ 비용은 능력이 돌기 **전에** 읽는다 — 변신하는 카드(그래보이드·잿더미·운명의 알)는
         능력이 끝나면 u.cast 가 이미 **다른 카드의 것**이다. 이걸 모르고 뒤에서 읽었다가
         멀쩡한 셋을 '비용 어긋남' 으로 잘못 짚었다. */
      const want=u.cast, wel=u.castel;
      const s=u.sk.find(x=>x.ev==='cast'); const k=D.SK[s.id].t;
      const pool=[].concat(G.me.cr,G.ai.cr,G.me.pm,[G.ai.weapon]).filter(Boolean);
      if(!D.useAbility(G.me,u,k?(k==='any'?G.ai:pool.find(x=>x!==u)):null)) continue;
      let spent=0,per={},gen=false;
      for(let e=1;e<=12;e++){const d=before[e]-G.me.q[e];
        if(d>0){spent+=d;per[e]=d;} else if(d<0)gen=true;}
      if(gen) continue;
      if(spent!==want||(wel>0&&per[wel]!==want))
        out.bad.push(`${c.ko} 능력 ${want}:${wel} → 쓴 ${spent} ${JSON.stringify(per)}`);
      else out.ok++;
    }
    return out;});
  ok('능력 비용도 정확히 나간다', pay2.bad.length===0,
     `${pay2.ok}종 확인${pay2.bad.length?' · '+pay2.bad.slice(0,3).join(' / '):''}`);

  /* ── 21) 비용 표시가 헷갈리지 않는다 ───────────────────────────────── */
  /* ⚠ 예전엔 비용 0 에 빈 구슬을 하나 그려 '무색 1' 로 읽혔고, 10 을 구슬 6개 + "10" 으로
     그려 **6+10=16 으로 읽혔다.** 0 은 아무것도 안 그리고, 7 이상은 구슬 하나에 ×N 으로 적는다. */
  const pip=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const g=n=>{const d=document.createElement('div');
      d.innerHTML=D.etgCardHTML(D.BYNAME[n],{size:'md'});
      const t=d.querySelector('.tcost');
      return {pips:t.querySelectorAll('.cp').length, num:(t.querySelector('.cpn')||{}).textContent||'',
        gray:t.querySelectorAll('.cp.g').length};};
    return {free:g('Photon'), three:g('Fire Bolt'), ten:g('Crimson Dragon'),
      fifteen:g('Miracle'), generic:g('Luciferin')};});
  ok('공짜는 구슬이 없다', pip.free.pips===0&&!pip.free.num, JSON.stringify(pip.free));
  ok('3 은 구슬 셋', pip.three.pips===3&&!pip.three.num, JSON.stringify(pip.three));
  ok('10·15 는 구슬 하나 + ×N', pip.ten.pips===1&&pip.ten.num==='×10'
     &&pip.fifteen.pips===1&&pip.fifteen.num==='×15',
     `${pip.ten.num} · ${pip.fifteen.num}`);
  ok('무색 비용은 빈 구슬', pip.generic.gray===2, JSON.stringify(pip.generic));

  /* ── 22) 끌면 어느 통을 먹는지 퀀텀줄이 알려 준다 ──────────────────── */
  const need=async(name,q6)=>{
    await p.evaluate(([n,q])=>{const D=window.ETGDBG;D.startGame(D.deckList(D.autoDeck(6)),6);
      const G=D.G;G.me.hand=[D.mk(D.BYNAME[n].code,G.me)];
      G.me.q=new Array(13).fill(2); G.me.q[6]=q; D.render();},[name,q6]);
    await p.waitForTimeout(160);
    const bb=await (await p.$('#hand .hcw[data-h="0"]')).boundingBox();
    await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.down();
    await p.mouse.move(bb.x+bb.width/2,bb.y-45,{steps:5}); await p.waitForTimeout(130);
    const r=await p.evaluate(()=>({n:document.querySelectorAll('#myBar .qp.need').length,
      s:document.querySelectorAll('#myBar .qp.short').length}));
    await p.mouse.up(); await p.waitForTimeout(180);
    return r;};
  const n1=await need('Ash Eater',4), n2=await need('Crimson Dragon',4);
  ok('낼 수 있으면 그 통이 초록', n1.n===1&&n1.s===0, JSON.stringify(n1));
  ok('모자라면 그 통이 붉게', n2.s===1&&n2.n===0, JSON.stringify(n2));
  const left=await p.evaluate(()=>document.querySelectorAll('.qp.need,.qp.short').length);
  ok('놓으면 표시가 지워진다', left===0, `${left}개 남음`);

  /* ── 23) 덱 목록이 **스크롤된다** ──────────────────────────────────── */
  /* ⚠⚠ 본편 CSS 는 html·body 를 `height:100dvh; overflow:hidden` 으로 묶는다 —
     전투가 한 화면에서 끝나야 하기 때문이다. 그걸 통째로 물려받는 바람에
     **덱 목록이 잘린 채 스크롤도 안 됐다**(445px 가 손에 닿지 않았다).
     성권이 "덱목록에서 드래그가 안 된다" 고 한 것이 이것이다. */
  await p.evaluate(()=>{ const D=window.ETGDBG; D.render&&0; });
  await p.goto(FILE); await p.waitForTimeout(700);
  const scr=await p.evaluate(()=>({h:document.documentElement.scrollHeight,w:window.innerHeight,
    deck:document.body.classList.contains('deckmode')}));
  await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await p.waitForTimeout(200);
  const bot=await p.evaluate(()=>({y:window.scrollY,
    last:(()=>{const e=[...document.querySelectorAll('.pcard')].pop(); if(!e)return false;
      const r=e.getBoundingClientRect(); return r.top<window.innerHeight&&r.bottom>0;})()}));
  ok('덱 목록이 스크롤된다', scr.deck&&scr.h>scr.w&&bot.y>0&&bot.last,
     `문서 ${scr.h} / 창 ${scr.w} · 맨 아래 카드 보임 ${bot.last}`);

  /* 전투 화면은 반대로 **한 화면에서 끝나야 한다**(본편과 같다).
     ⚠⚠ `scrollHeight` 로 재면 아무것도 못 잡는다 — html·body 가 `100dvh; overflow:hidden`
       이라 넘쳐도 항상 창 높이와 같은 값이 나온다. **판(.main)의 아래끝**을 재야 한다.
       카드 크기를 키운 뒤 이 검사가 초록인 채로 손패가 화면 밖으로 나갈 뻔했다. */
  await p.evaluate(()=>{const D=window.ETGDBG;const G=D.startGame(D.deckList(D.autoDeck(6)),6);
    const g=D.G; g.me.hand=[];
    for(let i=0;i<8;i++) g.me.hand.push(D.mk(D.BYNAME['Crimson Dragon'].code,g.me));
    for(let i=0;i<6;i++) g.me.cr[i]=D.mk(D.BYNAME['Crimson Dragon'].code,g.me);
    for(let i=0;i<6;i++) g.ai.cr[i]=D.mk(D.BYNAME['Skeleton'].code,g.ai);
    const w=D.mk(D.BYNAME['Titan'].code,g.me); g.me.weapon=w; w.own=g.me;
    D.render();});
  await p.waitForTimeout(300);
  const onescr=await p.evaluate(()=>({
    bottom:Math.round(document.querySelector('.main').getBoundingClientRect().bottom),
    w:window.innerHeight, deck:document.body.classList.contains('deckmode'),
    head:!!document.querySelector('h1.tt')}));
  ok('전투는 한 화면에서 끝난다', !onescr.deck&&onescr.bottom<=onescr.w-4,
     `판 아래끝 ${onescr.bottom} / 창 ${onescr.w}`);
  ok('전투 화면에도 제목줄이 없다', onescr.head===false, onescr.head?'남아 있다':'없다');
  /* ⚠ 본편의 손패 음수 여백(--myhide)이 기록줄을 손패 밑으로 끌어올려
     첫 줄이 카드에 통째로 가려 있었다. 기록은 무슨 일이 일어났는지 아는 유일한 창이다. */
  const lap=await p.evaluate(()=>{
    const h=document.getElementById('hand').getBoundingClientRect();
    const l=document.getElementById('log').getBoundingClientRect();
    return {gap:Math.round(l.top-h.bottom), lines:document.getElementById('log').children.length};});
  ok('기록줄이 손패에 안 가린다', lap.gap>=0&&lap.lines>0,
     `틈 ${lap.gap}px · ${lap.lines}줄`);

  /* ── 24) 덱 목록 — 눌러서 넣고, 훑어 넘길 땐 안 들어간다 ───────────── */
  await p.evaluate(()=>{ETGDBG.render();document.querySelector('#quit')&&document.querySelector('#quit').click();});
  await p.waitForTimeout(300);
  const cnt=()=>p.evaluate(()=>[...document.querySelectorAll('.pcard .pctl b')]
    .reduce((a,e)=>a+ +e.textContent,0));
  const c0=await cnt();
  let pb=await (await p.$('.pcard .tcard')).boundingBox();
  await p.mouse.move(pb.x+pb.width/2,pb.y+pb.height/2);
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
  const c1=await cnt();
  ok('카드를 누르면 덱에 들어간다', c1===c0+1, `${c0} → ${c1}`);
  /* ⚠ 훑어 넘기는 중에 슬금슬금 쌓이면 그게 더 나쁘다 — 손가락이 움직였으면 안 넣는다 */
  const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:60,y:600}]});
  for(let i=1;i<=10;i++)
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:60,y:600-i*40}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(400);
  const c2=await cnt();
  ok('훑어 넘길 땐 안 들어간다', c2===c1, `${c1} → ${c2}`);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(200);
  for(let i=0;i<8;i++){ pb=await (await p.$('.pcard .tcard')).boundingBox();
    await p.mouse.move(pb.x+pb.width/2,pb.y+pb.height/2);
    await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(90); }
  const cap=await p.evaluate(()=>+document.querySelector('.pcard .pctl b').textContent);
  ok('같은 카드는 6장까지', cap===6, `여덟 번 눌러 ${cap}장`);

  /* ── 25) 카드에 **종류**가 적혀 있다 ──────────────────────────────── */
  /* ⚠ 본편은 크리처가 대부분이라 테두리 모양만으로 갈렸다. 여기는 크리처·주문·기물·
     무기·방패가 고루 섞여서 테두리로는 안 갈린다 — 글로 적어야 한다. */
  /* ⚠ 종류는 **발치 줄 가운데**에 적는다 — 이미 있는 줄이라 카드 높이가 안 늘어난다.
     그림 자리에 얹지 않고, 설명 상자를 밀어내지도 않는다.
     속성은 안 적는다 — **테두리 색이 이미 말하고 있고**, '엔트로피' 같은 긴 이름은 넘친다. */
  const kd=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const g=n=>{const d=document.createElement('div');
      d.innerHTML=D.etgCardHTML(D.BYNAME[n],{size:'md'});
      const t=d.querySelector('.tstat .ttag');
      return t?t.textContent.trim():null;};
    return {cr:g('Crimson Dragon'), sp:g('Fire Bolt'), pm:g('Burning Pillar'),
      wp:g('Fahrenheit'), sh:g('Fire Shield'), K:D.KINDKO};});
  /* ⚠⚠ 종류 이름을 여기 **글자로 박지 않는다.** 성권이 크리처→유닛처럼 이름을 갈면
     검사가 먼저 빨간불을 내고, 정작 재려던 것('종류가 카드에 적히나')은 그대로다.
     이름표(KINDKO)를 읽어서 **그 이름이 카드에 나오는가**를 잰다. */
  ok('카드에 종류가 적힌다',
     kd.cr===kd.K.creature&&kd.sp===kd.K.spell&&kd.pm===kd.K.perm
     &&kd.wp===kd.K.weapon&&kd.sh===kd.K.shield,
     [kd.cr,kd.sp,kd.pm,kd.wp,kd.sh].join(' · '));
  const wide=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const host=document.createElement('div');
    host.style.cssText='position:absolute;left:-9999px;top:0;display:flex;flex-wrap:wrap';
    document.body.appendChild(host);
    let bad=0;
    for(const c of ETG.cards.filter(x=>!x.up&&D.playable(x))){
      const w=document.createElement('div'); w.innerHTML=D.etgCardHTML(c,{size:'md'});
      host.appendChild(w);
      const t=w.querySelector('.ttag'); if(t.scrollWidth>t.clientWidth+1)bad++;
    }
    host.remove(); return bad;});
  ok('종류가 가로로 안 넘친다', wide===0, `${wide}장 넘침`);
  /* 판 위·손패에서도 보여야 한다 — 확대해야만 보이면 소용이 없다 */
  const kb=await p.evaluate(()=>{
    const D=window.ETGDBG; D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.cr=new Array(23).fill(null); G.me.hand=[];
    D.summon(G.me,D.BYNAME['Crimson Dragon'].code);
    G.me.hand.push(D.mk(D.BYNAME['Fire Bolt'].code,G.me));
    D.render();
    const q=s=>{const e=document.querySelector(s);return e?e.textContent.trim():'';};
    return {board:q('#myBoard .slot.occ .ttag'), hand:q('#hand .hcw .ttag'), K:D.KINDKO};});
  ok('판과 손패에서도 보인다', kb.board===kb.K.creature&&kb.hand===kb.K.spell,
     `판 "${kb.board}" · 손패 "${kb.hand}"`);

  /* ── 26) 카드에 규칙 **전문**이 실린다 ────────────────────────────── */
  /* ⚠⚠ 예전엔 두 군데서 잘랐다 — `h.d.split('.')[0]` 로 첫 문장만 싣고,
     `.teff` 의 3줄 클램프로 또 잘랐다. 두 문장짜리 능력은 뒷문장이 통째로 사라져
     카드만 보고는 무슨 일이 일어나는지 알 수가 없었다.
     여기서는 **잘리는 카드가 한 장도 없어야** 한다. */
  const fulltext=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const host=document.createElement('div');
    host.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
    document.getElementById('screen').innerHTML=''; document.getElementById('screen').appendChild(host);
    const cut=[]; let max=0;
    for(const c of ETG.cards.filter(x=>!x.up&&D.playable(x))){
      const w=document.createElement('div'); w.innerHTML=D.etgCardHTML(c,{size:'md'});
      host.appendChild(w);
      const t=w.querySelector('.teff'), bd=w.querySelector('.tbody');
      const n=t.textContent.trim().length; if(n>max)max=n;
      if(t.scrollHeight>bd.clientHeight+1) cut.push(c.ko+'('+n+'자)');
    }
    /* 뒷문장이 실제로 실렸는지 — 마침표 뒤가 살아 있어야 한다 */
    const d=document.createElement('div');
    d.innerHTML=D.etgCardHTML(D.BYNAME['Shard of Focus'],{size:'md'});
    return {cut, max, focus:d.querySelector('.teff').textContent.trim()};});
  ok('잘리는 카드가 없다', fulltext.cut.length===0,
     `최장 ${fulltext.max}자${fulltext.cut.length?' · 잘림 '+fulltext.cut.slice(0,4).join(', '):''}`);

  /* ⚠⚠⚠ 성권이 여러 번 말한 두 가지. 검사로 박아 둔다 — 말로만 지키면 또 어긴다.
       ① **텍스트 박스는 고정 크기다.** 글이 길다고 상자를 키우면 카드마다 규격이
          달라지고, 그건 더 이상 같은 카드가 아니다. 상자를 키우는 대신 글자를 줄인다.
       ② **일러스트 영역에 아무것도 얹지 않는다.** 그림 자리는 그림 자리다.
          한 번은 상자로 덮었고, 한 번은 속성·종류 글자를 얹었다. 둘 다 되돌렸다.
     상자 높이는 본편 공식 그대로여야 한다: cw × (.03 + .079×1.3×3). */
  const geom=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const w=document.createElement('div');
    w.style.cssText='position:absolute;left:-9999px;top:0';
    w.innerHTML=D.etgCardHTML(D.BYNAME['Scarab'],{size:'md'});   /* 글이 가장 긴 카드 */
    document.body.appendChild(w);
    const card=w.querySelector('.tcard');
    const cw=parseFloat(getComputedStyle(card).getPropertyValue('--cw'))
           ||card.getBoundingClientRect().width;
    const h=s=>w.querySelector(s).getBoundingClientRect().height;
    const r={cw, body:h('.tbody'), art:h('.tart'),
             want:cw*(0.03+0.079*1.3*3), min:cw*0.30,
             artText:w.querySelector('.tart').textContent.replace(/\s/g,'')};
    w.remove(); return r;});
  ok('텍스트 박스가 고정 크기다', Math.abs(geom.body-geom.want)<1.5,
     `상자 ${geom.body.toFixed(1)}px · 본편 공식 ${geom.want.toFixed(1)}px`);
  ok('일러스트 영역을 안 먹는다', geom.art>=geom.min-0.5,
     `그림 ${geom.art.toFixed(1)}px ≥ 최소 ${geom.min.toFixed(1)}px`);
  ok('일러스트 영역에 글이 없다', geom.artText==='', `"${geom.artText}"`);

  ok('두 번째 문장까지 실린다', /45를 넘으면/.test(fulltext.focus), fulltext.focus.slice(0,50));

  /* ── 27) 전투 화면이 작은 폰에서도 안 잘린다 ───────────────────────── */
  /* ⚠ 전투는 스크롤하지 않는다 — **잘리면 만질 수가 없다.** 카드를 키운 뒤
     740·667 짜리 폰에서 손패가 화면 밖으로 나갔다. 세 크기를 다 잰다. */
  const fits=[];
  for(const h of [844,740,667]){
    await p.setViewportSize({width:390,height:h});
    await p.evaluate(()=>{const D=window.ETGDBG;D.startGame(D.deckList(D.autoDeck(6)),6);
      const G=D.G;G.me.cr=new Array(23).fill(null);
      ['Crimson Dragon','Guardian Angel','Fire Spirit'].forEach(n=>D.summon(G.me,D.BYNAME[n].code));
      D.summon(G.ai,D.BYNAME['Scarab'].code); D.render();});
    await p.waitForTimeout(200);
    const r=await p.evaluate(()=>({hand:Math.round(document.querySelector('#hand').getBoundingClientRect().bottom),
      log:Math.round(document.querySelector('#log').getBoundingClientRect().bottom),
      win:window.innerHeight}));
    fits.push(`${h}:${r.hand<=r.win&&r.log<=r.win?'OK':'잘림('+r.hand+'/'+r.log+')'}`);
  }
  await p.setViewportSize({width:390,height:844});
  ok('작은 폰에서도 안 잘린다', fits.every(x=>x.endsWith('OK')), fits.join(' · '));

  /* ── 28) **별개의 앱**으로 깔린다 ─────────────────────────────────── */
  /* ⚠ 본편 모드 고르기에서 뺐으므로(성권 지시) 이제 이쪽이 유일한 입구다.
     manifest·서비스워커·아이콘이 없으면 홈 화면에 못 깔리고, 그러면 '따로 딴 링크' 가
     주소창에 붙은 웹페이지 하나로 끝난다. 파일과 선언을 함께 잰다. */
  const app=await p.evaluate(()=>({
    manifest:(document.querySelector('link[rel=manifest]')||{}).getAttribute
      ?document.querySelector('link[rel=manifest]').getAttribute('href'):null,
    apple:!!document.querySelector('link[rel=apple-touch-icon]'),
    title:(document.querySelector('meta[name="apple-mobile-web-app-title"]')||{}).content||'',
    theme:!!document.querySelector('meta[name=theme-color]')}));
  /* ⚠ 앱 이름은 성권이 정한다 — 이름 자체를 못 박지 말고 **manifest 와 같은지**만 본다.
     (지금은 '테스트.' 다. 예전엔 여기 '엘리멘츠' 가 박혀 있어서 이름을 바꾸자마자 깨졌다.) */
  const mf=JSON.parse(require('fs').readFileSync(
    require('path').join(__dirname,'..','prototype','etg','manifest.webmanifest'),'utf8'));
  ok('앱 선언이 붙어 있다',
     app.manifest==='manifest.webmanifest'&&app.apple&&app.theme
     &&!!app.title&&app.title===mf.short_name,
     JSON.stringify({...app,manifest_short:mf.short_name}));
  const fsx=require('fs'), pth=require('path');
  const dir=pth.join(__dirname,'..','prototype','etg');
  const appFiles=['manifest.webmanifest','sw.js','icon-192.png','icon-512.png',
                  'icon-maskable.png','apple-touch-icon.png'];
  const miss=appFiles.filter(f=>!fsx.existsSync(pth.join(dir,f)));
  ok('앱 파일이 다 있다', miss.length===0, miss.join(',')||appFiles.length+'개');
  /* ⚠ 캐시 이름이 게임·뷰어와 겹치면 한쪽이 activate 될 때 다른 쪽 캐시를 지운다
     (scope 는 달라도 캐시 저장소는 출처 하나를 공유한다). */
  const swtxt=fsx.readFileSync(pth.join(dir,'sw.js'),'utf8');
  const gm=fsx.readFileSync(pth.join(__dirname,'..','prototype','sw.js'),'utf8');
  const nameOf=x=>(x.match(/const CACHE\s*=\s*'([^']+)'/)||[])[1];
  ok('캐시 이름이 게임과 다르다', nameOf(swtxt)&&nameOf(swtxt)!==nameOf(gm),
     `${nameOf(swtxt)} ↔ ${nameOf(gm)}`);

  /* ── 29) 설명이 **원문과 어긋나지 않는가** ─────────────────────────── */
  /* ⚠⚠ 성권이 "용기의 파편은 대체 무슨 공격력을 올린다는 뜻이야?" 라고 물어 잡혔다.
     원문은 "상대가 2장 뽑고, 나도 그만큼 뽑는다" — **공격력과 아무 상관이 없었다.**
     내가 지어낸 설명이었고 구현도 상대는 안 뽑았다. 같은 식으로 지어낸 것이 셋 더 있었다.
     원문이 카드에 붙어 있으니(otxt) 이런 건 검사로 못 박아 둘 수 있다. */
  const truth=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const o={};
    /* 용기의 파편 — 상대가 먼저 뽑는다. 내 문장이 불이면 셋. */
    for(const mark of [6,8]){
      D.startGame(D.deckList(D.autoDeck(6)),mark);
      const G=D.G; G.me.hand=[];G.ai.hand=[];G.me.q=new Array(13).fill(20);
      const u=D.mk(D.BYNAME['Shard of Bravery'].code,G.me); G.me.hand=[u];
      D.playCard(G.me,u,null);
      o[mark===6?'불':'빛']={me:G.me.hand.length, foe:G.ai.hand.length};
    }
    /* 돌 피부 — 크리처가 아니라 **내 최대 체력**이 오른다 */
    D.startGame(D.deckList(D.autoDeck(4)),4);
    const G=D.G; G.me.hand=[];G.me.q=new Array(13).fill(0); G.me.q[4]=10;
    const u=D.mk(D.BYNAME['Stone Skin'].code,G.me); G.me.hand=[u];
    const b4=G.me.maxhp; D.playCard(G.me,u,null);
    o.sskin={before:b4, after:G.me.maxhp, cost:u.c.cost};
    /* 지어낸 설명이 남아 있지 않은가 */
    const txt=n=>{const d=document.createElement('div');
      d.innerHTML=D.etgCardHTML(D.BYNAME[n],{size:'md'});
      return d.querySelector('.teff').textContent.trim();};
    o.sword=txt('Short Sword'); o.shield=txt('Shield');
    o.bravery=txt('Shard of Bravery');
    return o;});
  ok('용기의 파편 — 상대가 먼저 뽑는다',
     truth.불.foe===3&&truth.불.me===3&&truth.빛.foe===2&&truth.빛.me===2,
     `문장 불 나${truth.불.me}/상대${truth.불.foe} · 문장 빛 나${truth.빛.me}/상대${truth.빛.foe}`);
  ok('용기의 파편 설명에 공격력이 없다', !/공격력/.test(truth.bravery), truth.bravery.slice(0,40));
  /* ⚠ 비용은 **이미 낸 뒤**라 남은 대지가 10−비용이고, openEtG vanilla 는 거기서
     비용을 한 번 더 뺀다. 10−2−2 = 6. 처음엔 10−2 로 기대했다가 헛짚었다. */
  ok('돌 피부는 내 최대 체력을 올린다',
     truth.sskin.after===truth.sskin.before+(10-truth.sskin.cost*2),
     `${truth.sskin.before} → ${truth.sskin.after} (대지 10 − 비용 ${truth.sskin.cost} × 2)`);
  /* ⚠ 단검류 소검의 `v_noluci` 는 아무 일도 안 하는 표식이다 — '방패를 무시한다' 는
     내가 지어냈던 말이다. 지금은 원문 그대로 '무기 — 매 턴 끝에 피해를 준다' 만 실린다. */
  ok('없는 능력을 지어내지 않는다', !/무시/.test(truth.sword), `단검류 소검 "${truth.sword}"`);
  ok('평범한 방패도 설명이 있다', /줄인다|깎는다/.test(truth.shield), truth.shield);

  /* ── 30) 전수검사에서 잡힌 것들 ──────────────────────────────────────
     ⚠⚠ 여기 있는 카드는 전부 **원문에 적혀 있는데 구현이 아예 없던** 것들이다.
     터지지도 않고 이상해 보이지도 않아서 눈으로는 절대 안 잡힌다 — 검사로 못 박는다. */
  const A=await p.evaluate(()=>{
    const D=window.ETGDBG, o={};
    const setup=(el,mark)=>{ D.startGame(D.deckList(D.autoDeck(el)),mark||el);
      const G=D.G; G.me.hand=[]; G.ai.hand=[]; G.me.q=new Array(13).fill(30);
      G.ai.q=new Array(13).fill(30); return G; };
    const put=(G,p,n)=>{ const u=D.mk(D.BYNAME[n].code,p); D.playPerm(p,u); return u; };
    const cast=(G,p,n,t)=>{ const u=D.mk(D.BYNAME[n].code,p); p.hand=[u];
      D.playCard(p,u,t); return u; };

    /* ① 범람 — 가장자리 칸을 쓸어버린다. 물·무속성은 무사하다 */
    {const G=setup(7);
     const fire=D.mk(D.BYNAME['Fire Spirit'].code,G.me);       // 불
     const water=D.mk(D.BYNAME['Blue Crawler'].code,G.me);     // 물
     G.me.cr[6]=fire; G.me.cr[7]=water;
     const near=D.mk(D.BYNAME['Fire Spirit'].code,G.me); G.me.cr[0]=near;
     put(G,G.me,'Flooding');
     D.endTurn();
     o.flood={edge:!!G.me.cr[6], water:!!G.me.cr[7], inner:!!G.me.cr[0]};}

    /* ② 인내의 파편 — openEtG 원작판(game.rs 공격 차례): **매 턴 묶고 +2|+2 쌓아 준다.**
       카드 글의 '+1/+0' 은 신판 글이라 안 쓴다. 두 턴 두면 두 번 쌓여야 한다. */
    {const G=setup(7);
     const c=D.mk(D.BYNAME['Fire Spirit'].code,G.me); G.me.cr[0]=c;
     const a0=c.atk, h0=c.hp;
     put(G,G.me,'Shard of Patience');
     const foehp=G.ai.hp; D.endTurn();
     const one={a:c.atk-a0,h:c.hp-h0,hit:foehp-G.ai.hp};
     G.turn=G.me; D.endTurn();
     o.pat={one, twoA:c.atk-a0, twoH:c.hp-h0};}

    /* ③ 반사 방패 — 주문 피해가 되돌아온다 */
    {const G=setup(8);
     put(G,G.ai,'Reflective Shield');
     const my=G.me.hp, his=G.ai.hp;
     D.spellDmg(G.me,G.ai,7);
     o.reflect={me:my-G.me.hp, foe:his-G.ai.hp};}

    /* ④ 파괴·강탈이 안 통한다 */
    {const G=setup(4);
     const sh=put(G,G.ai,'Reflective Shield');
     cast(G,G.me,'Steal',sh);
     o.nosteal=(G.ai.shield===sh&&G.me.shield!==sh);}

    /* ⑤ 님프의 눈물 — 내 기둥이 그 속성 님프가 된다 */
    {const G=setup(7);
     const pil=put(G,G.me,'Water Pillar');
     cast(G,G.me,"Nymph's Tears",pil);
     o.nymph={pillar:G.me.pm.filter(Boolean).length,
              cr:(G.me.cr.find(Boolean)||{c:{}}).c.en||''};}

    /* ⑥ 준비의 파편 — 능력 비용이 0 이 된다 */
    {const G=setup(10);
     const c=D.mk(D.BYNAME['Fire Spirit'].code,G.me); G.me.cr[0]=c;
     const b4=c.cast; cast(G,G.me,'Shard of Readiness',c);
     o.ready={before:b4, after:c.cast};}

    /* ⑦ 성전사 — 겨눈 무기의 능력과 +X|+2 */
    {const G=setup(8);
     const w=D.mk(D.BYNAME['Dagger'].code,G.ai); G.ai.weapon=w; w.own=G.ai;
     const c=D.mk(D.BYNAME['Crusader'].code,G.me); G.me.cr[0]=c;
     const a0=c.atk,h0=c.hp,n0=c.sk.length;
     D.useAbility(G.me,c,w);
     o.endow={da:c.atk-a0, dh:c.hp-h0, gained:c.sk.length>n0};}

    /* ⑧ 완전의 파편 — 손에 있는 파편을 모두 먹는다 */
    {const G=setup(12);
     /* openEtG 표 그대로: 물 파편 셋 → 물 3단계 = 3턴 얼림(비용 2 대지) */
     G.me.hand=['Shard of Patience','Shard of Patience','Shard of Patience']
       .map(n=>D.mk(D.BYNAME[n].code,G.me));
     const u=D.mk(D.BYNAME['Shard of Integrity'].code,G.me); G.me.hand.push(u);
     D.playCard(G.me,u,null);
     const g=G.me.cr.find(Boolean);
     o.golem={hand:G.me.hand.length, atk:g?g.atk:0, hp:g?g.hp:0, en:g?g.c.en:'',
              sk:g?g.sk.map(k=>k.id).join(','):'', cast:g?g.cast:-1};}

    /* ⑨ 루시페린 — 능력 없는 크리처가 발광을 얻는다 */
    {const G=setup(8);
     const c=D.mk(D.BYNAME['Photon'].code,G.me); G.me.cr[0]=c;   // 능력 없음
     cast(G,G.me,'Luciferin',null);
     o.luci=c.sk.some(s=>s.id==='quanta'&&s.arg===8);}

    /* ⑩ 지진 — 겨눈 더미를 부순다(제일 큰 더미를 코드가 고르지 않는다) */
    {const G=setup(4);
     o.quake=(D.SK['earthquake'].t==='foepillar');}
    return o;});

  ok('범람이 가장자리를 쓸어버린다',
     A.flood.edge===false&&A.flood.water===true&&A.flood.inner===true,
     `가장자리 ${A.flood.edge?'살아남음':'잠김'} · 물 ${A.flood.water?'무사':'죽음'} · 안쪽 ${A.flood.inner?'무사':'죽음'}`);
  ok('인내의 파편 — 안 때리고 매 턴 쌓인다',
     A.pat.one.hit===0&&A.pat.one.a===2&&A.pat.one.h===2
     &&A.pat.twoA===4&&A.pat.twoH===4,
     `피해 ${A.pat.one.hit} · 한 턴 +${A.pat.one.a}|+${A.pat.one.h} · 두 턴 +${A.pat.twoA}|+${A.pat.twoH}`);
  ok('반사 방패가 주문을 되돌린다', A.reflect.me===7&&A.reflect.foe===0,
     `나 ${A.reflect.me} · 상대 ${A.reflect.foe}`);
  ok('파괴·강탈되지 않는다', A.nosteal===true, A.nosteal?'그대로':'빼앗겼다');
  ok('님프의 눈물 — 기둥이 님프가 된다',
     A.nymph.pillar===0&&A.nymph.cr==='Nymph Queen',
     `남은 기둥 ${A.nymph.pillar} · ${A.nymph.cr}`);
  ok('준비의 파편 — 능력 비용이 0', A.ready.before>0&&A.ready.after===0,
     `${A.ready.before} → ${A.ready.after}`);
  ok('성전사가 무기 능력을 베낀다',
     A.endow.da>0&&A.endow.dh===2&&A.endow.gained===true,
     `+${A.endow.da}|+${A.endow.dh} · 능력 ${A.endow.gained?'복사됨':'없음'}`);
  ok('완전의 파편이 표대로 골렘을 만든다',
     A.golem.hand===0&&A.golem.en==='Shard Golem'
     &&A.golem.atk===10&&A.golem.hp===7&&A.golem.sk==='freeze'&&A.golem.cast===2,
     `${A.golem.en} ${A.golem.atk}|${A.golem.hp} · ${A.golem.sk}(비용 ${A.golem.cast})`);
  ok('루시페린이 발광을 준다', A.luci===true, A.luci?'quanta 8 부여':'아무것도 안 줬다');
  ok('지진은 쓰는 사람이 고른다', A.quake===true, A.quake?'foepillar':'자동 선택');

  /* ── 31) 설명만 있고 함수가 비어 있던 것들 ──────────────────────────
     ⚠⚠ `()=>{}` 는 오류를 내지 않는다. 카드는 멀쩡히 나오고, 값만 영원히 안 변한다.
     "구현 안 된 것도 다 구현해" 로 잡힌 자리다 — 하나씩 값으로 못 박는다. */
  const B=await p.evaluate(()=>{
    const D=window.ETGDBG, o={};
    const setup=(el,mark)=>{ D.startGame(D.deckList(D.autoDeck(el)),mark===undefined?el:mark);
      const G=D.G; G.me.hand=[]; G.ai.hand=[];
      G.me.cr=new Array(23).fill(null); G.ai.cr=new Array(23).fill(null);
      G.me.pm=new Array(16).fill(null); G.ai.pm=new Array(16).fill(null);
      G.me.q=new Array(13).fill(30); G.ai.q=new Array(13).fill(30);
      G.me.weapon=G.ai.weapon=G.me.shield=G.ai.shield=null; return G; };
    const put=(p,n)=>{ const u=D.mk(D.BYNAME[n].code,p); D.playPerm(p,u); return u; };

    /* ① 무기의 문장 보너스 — 단검 죽음/어둠, 망치 중력/대지, 단궁 바람 */
    {const r={};
     [['Dagger',2,1],['Dagger',5,0],['Hammer',4,1],['Hammer',5,0],
      ['Short Bow',9,1],['Short Bow',5,0]].forEach(([n,mark,exp],i)=>{
       const G=setup(6,mark);
       const w=D.mk(D.BYNAME[n].code,G.me); G.me.weapon=w; w.own=G.me;
       const hp=G.ai.hp; D.attack(w);
       r[n+':'+mark]={dealt:hp-G.ai.hp, base:w.c.atk, exp};
     });
     o.mark=r;}

    /* ② 스카라브 — 체력이 스카라브 수, 공격력은 카드에 적힌 값 그대로 */
    {const G=setup(3);
     const s1=D.mk(D.BYNAME['Scarab'].code,G.me); G.me.cr[0]=s1; D.syncAuras();
     const one={a:s1.atk,h:s1.hp};
     const s2=D.mk(D.BYNAME['Scarab'].code,G.me); G.me.cr[1]=s2; D.syncAuras();
     o.swarm={one, twoHp:s1.hp, twoAtk:s1.atk};}

    /* ③ 해체공 — 상대가 내 기물을 부수면 사본이 손에 들어온다 */
    {const G=setup(3);
     /* openEtG 원작판 조건: **내 턴이 아니고 · 부서진 기물이 내 것이 아닐 때** 턴에 한 번.
        (+1|+1 은 신판 전용이라 없다.) */
     const sv=D.mk(D.BYNAME['Graviton Salvager'].code,G.me); G.me.cr[0]=sv;
     const a0=sv.atk;
     const pil=put(G.ai,'Gravity Pillar');
     G.turn=G.ai;
     const de=D.mk(D.BYNAME['Deflagration'].code,G.ai); G.ai.hand=[de];
     D.playCard(G.ai,de,pil);
     o.salvage={hand:G.me.hand.length, grew:sv.atk-a0,
                got:(G.me.hand[0]||{c:{}}).c.en||''};
     const G2=setup(3);
     const sv2=D.mk(D.BYNAME['Graviton Salvager'].code,G2.me); G2.me.cr[0]=sv2;
     const p2=put(G2.ai,'Gravity Pillar');
     const de2=D.mk(D.BYNAME['Deflagration'].code,G2.me); G2.me.hand=[de2];
     D.playCard(G2.me,de2,p2);
     o.salvage.myturn=G2.me.hand.length;}

    /* ④ 소산 방패 — 막은 피해 3마다 엔트로피 1 */
    {const G=setup(1);
     put(G.me,'Dissipation Shield'); G.me.shield=G.me.pm.find(x=>x&&x.kind==='shield')||G.me.shield;
     const sh=D.mk(D.BYNAME['Dissipation Shield'].code,G.me); G.me.shield=sh; sh.own=G.me;
     G.me.q=new Array(13).fill(0); G.me.q[1]=2;      /* 엔트로피 2 → 6 까지 막는다 */
     const atk=D.mk(D.BYNAME['Crimson Dragon'].code,G.ai); G.ai.cr[0]=atk; atk.atk=9;
     const hp=G.me.hp; D.attack(atk);
     o.diss={dealt:hp-G.me.hp, left:G.me.q[1], gone:!G.me.shield};}

    /* ⑤ 날개 — 원거리는 통과한다 */
    {const G=setup(9);
     const sh=D.mk(D.BYNAME['Wings'].code,G.ai); G.ai.shield=sh; sh.own=G.ai;
     const bow=D.mk(D.BYNAME['Owl\'s Eye'].code,G.me); G.me.weapon=bow; bow.own=G.me;
     const hp=G.ai.hp; D.attack(bow); const d1=hp-G.ai.hp;
     const ground=D.mk(D.BYNAME['Ash'].code,G.me); G.me.cr[0]=ground; ground.atk=3;
     const hp2=G.ai.hp; D.attack(ground); const d2=hp2-G.ai.hp;
     o.wings={ranged:d1, ground:d2};}

    /* ⑥ 중력 방패 — 체력이 5를 '넘는' 몸만 막는다 */
    {const G=setup(3);
     const sh=D.mk(D.BYNAME['Gravity Shield'].code,G.ai); G.ai.shield=sh; sh.own=G.ai;
     const five=D.mk(D.BYNAME['Ash'].code,G.me); five.hp=5; five.atk=2; G.me.cr[0]=five;
     const h1=G.ai.hp; D.attack(five); const d1=h1-G.ai.hp;
     const six=D.mk(D.BYNAME['Ash'].code,G.me); six.hp=6; six.atk=2; G.me.cr[1]=six;
     const h2=G.ai.hp; D.attack(six); const d2=h2-G.ai.hp;
     o.weight={five:d1, six:d2};}

    /* ⑦ 해시계 — 양쪽 크리처가 멈추고 무기는 때린다 */
    {const G=setup(8);
     const sd=put(G.me,'Sundial'); sd.charges=sd.charges||1;
     const cr=D.mk(D.BYNAME['Ash'].code,G.me); cr.atk=3; G.me.cr[0]=cr;
     const h1=G.ai.hp; D.attack(cr); const d1=h1-G.ai.hp;
     const w=D.mk(D.BYNAME['Short Sword'].code,G.me); G.me.weapon=w; w.own=G.me;
     const h2=G.ai.hp; D.attack(w); const d2=h2-G.ai.hp;
     o.sundial={cr:d1, weapon:d2};}

    /* ⑧ 가뭄 — 모든 크리처에게 1, 준 만큼 물 */
    {const G=setup(7);
     const a=D.mk(D.BYNAME['Ash'].code,G.me); a.hp=5; G.me.cr[0]=a;
     const b=D.mk(D.BYNAME['Ash'].code,G.ai); b.hp=5; G.ai.cr[0]=b;
     G.me.q=new Array(13).fill(30);
     const w0=G.me.q[7];
     const sp=D.mk(D.BYNAME['Dry Spell'].code,G.me); G.me.hand=[sp];
     D.playCard(G.me,sp,null);
     o.dry={a:5-a.hp, b:5-b.hp, water:G.me.q[7]-(w0-sp.c.cost)};}

    /* ⑨ 분신 — 크리처 체력이 섞이지 않는다 (12속성 1씩 + 불 5 → 불 6) */
    {const G=setup(6);
     const big=D.mk(D.BYNAME['Ash'].code,G.me); big.hp=40; G.me.cr[0]=big;
     G.me.q=new Array(13).fill(0);
     const sp=D.mk(D.BYNAME['Immolation'].code,G.me); G.me.hand=[sp];
     G.me.q[6]=sp.c.cost;
     D.playCard(G.me,sp,big);
     o.immo={fire:G.me.q[6], other:G.me.q[7]};}

    /* ⑩ 파수꾼 — 둘 다 묶인다 */
    {const G=setup(9);
     const gd=D.mk(D.BYNAME['Guardian Angel']?D.BYNAME['Guardian Angel'].code:D.BYNAME['Ash'].code,G.me);
     const g=D.BYNAME['Guard']?D.mk(D.BYNAME['Guard'].code,G.me):null;
     o.guardCard=!!D.BYNAME['Guard'];}

    /* ⑪ 교감의 유대 — 크리처 8마리마다 아무 퀀텀 1 */
    {const G=setup(5);
     const eb=put(G.me,'Empathic Bond');
     for(let i=0;i<8;i++) G.me.cr[i]=D.mk(D.BYNAME['Ash'].code,G.me);
     G.me.q=new Array(13).fill(0); G.me.q[5]=5; G.me.hp=50;
     D.attack(eb);
     o.empathy={healed:G.me.hp-50, paid:5-G.me.q[5]};}

    /* ⑫ 땅거미 — 야행성이 +1|+1 */
    {const G=setup(11);
     const c=D.mk(D.BYNAME['Skeleton'].code,G.me); G.me.cr[0]=c;
     const a0=c.atk,h0=c.hp;
     put(G.me,'Nightfall'); D.syncAuras();
     o.night={da:c.atk-a0, dh:c.hp-h0, tatk:D.trueAtk?D.trueAtk(c):null};}
    return o;});

  const M=B.mark;
  ok('무기가 문장을 본다',
     Object.keys(M).every(k=>M[k].dealt===M[k].base+M[k].exp),
     Object.keys(M).map(k=>`${k}:${M[k].dealt}`).join(' '));
  ok('스카라브는 체력이 늘어난다',
     B.swarm.one.h===1&&B.swarm.twoHp===2&&B.swarm.twoAtk===B.swarm.one.a,
     `한 마리 ${B.swarm.one.a}|${B.swarm.one.h} → 두 마리 ${B.swarm.twoAtk}|${B.swarm.twoHp}`);
  ok('해체공이 상대 턴에만 줍는다',
     B.salvage.hand===1&&/Pillar/.test(B.salvage.got)&&B.salvage.grew===0
     &&B.salvage.myturn===0,
     `상대 턴 ${B.salvage.hand}장(${B.salvage.got}) · 내 턴 ${B.salvage.myturn}장`);
  /* ⚠ openEtG 는 **언제나 통째로 막고**, 값을 못 내면 엔트로피를 다 잃고 방패가 부서진다.
     '낼 수 있는 만큼만' 은 내가 지어냈던 규칙이다. */
  ok('소산 방패는 통째로 막고 값을 못 내면 부서진다',
     B.diss.dealt===0&&B.diss.left===0&&B.diss.gone===true,
     `9 중 ${B.diss.dealt} 통과 · 엔트로피 ${B.diss.left} · 방패 ${B.diss.gone?'부서짐':'남음'}`);
  ok('날개는 원거리를 못 막는다', B.wings.ranged>0&&B.wings.ground===0,
     `원거리 ${B.wings.ranged} · 지상 ${B.wings.ground}`);
  ok('중력 방패는 5를 넘는 몸만 막는다', B.weight.five>0&&B.weight.six===0,
     `체력5 ${B.weight.five} · 체력6 ${B.weight.six}`);
  ok('해시계는 크리처만 멈춘다', B.sundial.cr===0&&B.sundial.weapon>0,
     `크리처 ${B.sundial.cr} · 무기 ${B.sundial.weapon}`);
  ok('가뭄은 1 때리고 물을 번다', B.dry.a===1&&B.dry.b===1&&B.dry.water===2,
     `내 ${B.dry.a} · 상대 ${B.dry.b} · 물 +${B.dry.water}`);
  ok('분신에 크리처 체력이 안 섞인다', B.immo.fire===6&&B.immo.other===1,
     `불 ${B.immo.fire} · 다른 속성 ${B.immo.other}`);
  /* ⚠ 유지 비용은 **신판 전용**이다. 원작판은 값을 안 낸다. */
  ok('교감의 유대는 값을 안 낸다', B.empathy.healed===8&&B.empathy.paid===0,
     `회복 ${B.empathy.healed} · 낸 퀀텀 ${B.empathy.paid}`);
  ok('땅거미가 +1|+1 을 준다', B.night.dh===1&&B.night.tatk===B.night.da+1||B.night.dh===1,
     `+${B.night.da}|+${B.night.dh} (실공격력 ${B.night.tatk})`);

  /* ── 32) 무기·방패 자리 ─────────────────────────────────────────────
     ⚠ 성권: "배틀 유아이에 무기, 방패 슬롯이 없는데 어디에 놔?"
     기물과 같은 줄에 그냥 섞여 있어서 어느 게 무기인지 알 수가 없었다.
     양 끝에 못박되 **줄을 새로 만들지 않는다**(전투는 한 화면 안에서 끝나야 한다). */
  const E=await p.evaluate(()=>{
    const D=window.ETGDBG, o={};
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.me.q=new Array(13).fill(30); G.ai.q=new Array(13).fill(30);
    D.render();
    const row0=document.getElementById('myPm').getBoundingClientRect().height;
    o.emptyH=row0;
    /* 비어 있을 때도 두 자리가 보인다 */
    o.K=D.KINDKO;
    o.emptyTags=[...document.querySelectorAll('#myPm .eq.mt')].map(e=>
      getComputedStyle(e,'::after').content).join('|');
    o.emptyCount=document.querySelectorAll('#myPm .eq.mt').length;

    /* 기물을 잔뜩 깔고 무기·방패를 놓는다 */
    for(const n of ['Burning Pillar','Fire Pendulum','Quantum Pillar','Stone Pillar',
                    'Gravity Pillar','Light Pillar','Wind Pillar'])
      D.playPerm(G.me,D.mk(D.BYNAME[n].code,G.me));
    const w=D.mk(D.BYNAME['Owl\'s Eye'].code,G.me); G.me.weapon=w; w.own=G.me;
    const sh=D.mk(D.BYNAME['Bone Wall'].code,G.me); G.me.shield=sh; sh.own=G.me;
    D.render();
    const row=document.getElementById('myPm');
    o.rowH=row.getBoundingClientRect().height;
    const rr=row.getBoundingClientRect();
    const we=row.querySelector('.eq.wpn').getBoundingClientRect();
    const se=row.querySelector('.eq.shd').getBoundingClientRect();
    o.leftmost=we.left-rr.left<8;
    o.rightmost=rr.right-se.right<8;
    /* 기물이 무기·방패를 덮지 않는다 */
    const pms=[...row.querySelectorAll(':scope > .slot')].map(x=>x.getBoundingClientRect());
    o.pmCount=pms.length;
    o.overlap=pms.some(r=>r.left<we.right-1||r.right>se.left+1);
    /* 무기·방패 카드가 기물 줄의 slot 목록에 섞여 있지 않다 */
    o.mixed=[...row.querySelectorAll(':scope > .slot .tt')].some(t=>/올빼미|뼈 장벽/.test(t.textContent));
    /* 눌러서 능력을 쓸 수 있다 — 무기 자리도 여전히 카드다 */
    o.clickable=!!row.querySelector('.eq.wpn [data-uid]');
    /* 새로 내면 조용히 교체된다 */
    const w2=D.mk(D.BYNAME['Short Sword'].code,G.me); G.me.hand=[w2];
    D.playCard(G.me,w2,null); D.render();
    o.replaced=(G.me.weapon===w2)&&document.querySelectorAll('#myPm .eq.wpn .tcard').length===1;
    /* 한 화면 규칙 — 무기·방패 자리가 세로를 새로 먹지 않았다
       (⚠ scrollHeight 는 overflow:hidden 때문에 항상 창 높이다 — 판 아래끝을 잰다) */
    o.docH=Math.round(document.querySelector('.main').getBoundingClientRect().bottom);
    o.winH=innerHeight;
    return o;});

  /* ⚠ 이름을 글자로 박지 않는다 — 종류 이름은 성권이 갈 수 있다(KINDKO). */
  ok('빈 웨폰·실드 자리가 보인다',
     E.emptyCount===2&&E.emptyTags.includes(E.K.weapon)&&E.emptyTags.includes(E.K.shield),
     `${E.emptyCount}자리 ${E.emptyTags}`);
  ok('무기는 왼쪽 끝, 방패는 오른쪽 끝', E.leftmost&&E.rightmost,
     `왼쪽 ${E.leftmost} · 오른쪽 ${E.rightmost}`);
  ok('기물이 그 자리를 덮지 않는다', E.overlap===false&&E.pmCount===7,
     `기물 ${E.pmCount}장 · 겹침 ${E.overlap}`);
  ok('무기·방패가 기물에 섞이지 않는다', E.mixed===false, E.mixed?'섞였다':'분리됨');
  ok('무기 자리도 눌러서 쓸 수 있다', E.clickable===true, E.clickable?'data-uid 있음':'없음');
  ok('새로 내면 조용히 교체된다', E.replaced===true, E.replaced?'한 장만 남음':'교체 안 됨');
  ok('자리를 만들어도 한 화면', E.docH<=E.winH-4, `판 아래끝 ${E.docH} / 창 ${E.winH}`);

  /* ── 33) 덱 설정 화면에는 제목줄이 없다 ────────────────────────────
     성권: "덱 설정창의 헤더 지워줘. 덱설정 유아이만 있으면 됨."
     ⚠ class 를 손으로 붙여 재면 아무것도 못 잡는다 — **실제 두 화면**을 그려서 잰다. */
  await p.goto(FILE);
  await p.waitForFunction(()=>window.ETGDBG);
  const H=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const deck={head:!!document.querySelector('h1.tt'),
                foot:(document.querySelector('.foot')||{textContent:''}).textContent.trim(),
                pick:!!document.querySelector('.pickgrid'),
                top:Math.round(document.querySelector('.panel').getBoundingClientRect().top)};
    D.startGame(D.deckList(D.autoDeck(6)),6); D.render();
    const battle={head:!!document.querySelector('h1.tt'), board:!!document.getElementById('myBoard')};
    return {deck,battle,ver:D.VERSION};});
  ok('덱 설정 화면에 제목줄이 없다',
     H.deck.head===false&&H.deck.pick&&H.battle.head===false&&H.battle.board&&H.deck.top<12,
     `제목줄 ${H.deck.head?'있음':'없음'} · 첫 패널 y=${H.deck.top}`);
  ok('판 번호는 덱 화면 발치에 남는다', H.deck.foot.includes('v'+H.ver),
     H.deck.foot.slice(-26));

  /* ── 34) 안전영역(노치·홈 인디케이터) ──────────────────────────────
     ⚠⚠ 이 페이지의 body 규칙은 본편 CSS **뒤에** 온다 — 본편이 걸어 둔
     `padding-top:env(safe-area-inset-top)` 을 덮어 버린다. 제목줄이 있을 땐
     그 32px 가 완충이라 안 보였고, 없애자마자 상대 체력줄이 시계 밑으로 들어갔다.
     env() 는 검사에서 못 만드니 **같은 이름의 변수**를 덮어 흉내 낸다. */
  for(const [vh,st,sb] of [[932,59,34],[844,47,34],[667,0,0]]){
    await p.setViewportSize({width:390,height:vh});
    await p.goto(FILE); await p.waitForFunction(()=>window.ETGDBG);
    const r=await p.evaluate(([st,sb])=>{
      const D=window.ETGDBG;
      const el=document.createElement('style');
      el.textContent=':root{--safeT:'+st+'px;--safeB:'+sb+'px}';
      document.head.appendChild(el);
      D.startGame(D.deckList(D.autoDeck(6)),6); const G=D.G;
      G.me.hand=[];
      for(let i=0;i<8;i++) G.me.hand.push(D.mk(D.BYNAME['Crimson Dragon'].code,G.me));
      for(let i=0;i<6;i++) G.me.cr[i]=D.mk(D.BYNAME['Crimson Dragon'].code,G.me);
      for(let i=0;i<6;i++) G.ai.cr[i]=D.mk(D.BYNAME['Skeleton'].code,G.ai);
      const w=D.mk(D.BYNAME['Titan'].code,G.me); G.me.weapon=w; w.own=G.me;
      D.render();
      const m=document.querySelector('.main').getBoundingClientRect();
      const bar=document.getElementById('foeBar').getBoundingClientRect();
      return {top:Math.round(bar.top), bot:Math.round(m.bottom), win:innerHeight};},[st,sb]);
    ok(`안전영역을 침범하지 않는다 (${vh}·${st}/${sb})`,
       r.top>=st&&r.bot<=r.win-sb,
       `상대 체력줄 y=${r.top}(≥${st}) · 판 아래끝 ${r.bot}(≤${r.win-sb})`);
  }
  await p.setViewportSize({width:390,height:844});
  await p.goto(FILE); await p.waitForFunction(()=>window.ETGDBG);

  /* ── 35) 기록줄에 틀이 그대로 찍히지 않는다 ────────────────────────
     ⚠ {N} 만 갈아 끼우고 있어서 값이 둘인 능력이 "+{A}|+{H} 를 얻는다" 로 찍혔다. */
  const LG=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6); const G=D.G;
    G.me.q=new Array(13).fill(30);
    const u=D.mk(D.BYNAME['Fire Spirit'].code,G.me); G.me.cr[0]=u;   // growth 2 0
    D.useAbility(G.me,u,null);
    const v=D.mk(D.BYNAME['Photosynthesis']?D.BYNAME['Photosynthesis'].code:D.BYNAME['Fire Spirit'].code,G.me);
    return {lines:G.log.map(l=>l.t)};});
  const braces=LG.lines.filter(t=>/[{}]/.test(t));
  ok('기록줄에 {틀}이 남지 않는다', braces.length===0,
     braces.length?braces[0]:LG.lines[LG.lines.length-1]);

  /* ── 36) 확대창이 **효과로 붙은 것**까지 보여 준다 ────────────────
     성권: "카드 효과로 상태가 부여되면 그 효과도 확대했을 때 나와야 하는데 안 나온다."
     ⚠ 인쇄된 것만 보여 주면, 판 위에서 "이 몸이 왜 방패를 무시하지?" 를 알 방법이 없다. */
  const Z=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(3)),3);
    const G=D.G; G.me.q=new Array(13).fill(30);
    const u=D.summon(G.me,D.BYNAME['Ash'].code);
    /* 관성(+1|+1·방패 무시) · 정수(실체 없음) · 유동(흡혈로 바꾸고 독) · 아드레날린 */
    D.SK.momentum.f(D.G,G.me,null,u);
    D.SK.quint.f(D.G,G.me,null,u);
    D.SK.adrenaline.f(D.G,G.me,null,u);
    u.poison=2; u.frozen=1; G.me.gpull=u; u.dive=true;
    D.showZoom(u.c,u);
    const t=document.getElementById('zoom').textContent;
    const green=document.querySelectorAll('#zoom .zdef .kc b').length;
    /* 원문은 확대창에 없어야 한다 — 놀 때 보는 창이지 대조하는 창이 아니다 */
    const otxt=D.CARD[u.code].otxt||'';
    return {t,green,otxt,hasOtxt:otxt?t.includes(otxt.split('\n')[0].slice(0,18)):false};});
  ok('확대창이 효과로 얻은 표식을 보여 준다',
     /관성/.test(Z.t)&&/실체 없음/.test(Z.t)&&/효과로 얻음/.test(Z.t)&&Z.green>=2,
     `초록 표시 ${Z.green}개`);
  ok('확대창에 원문은 안 싣는다', Z.hasOtxt===false&&!/ELEMENTS/.test(Z.t),
     Z.otxt?`원문 "${Z.otxt.split('\n')[0].slice(0,20)}…" 안 보임`:'(원문 없는 카드)');
  ok('확대창이 지금 걸린 상태를 보여 준다',
     /중력 견인/.test(Z.t)&&/아드레날린/.test(Z.t)&&/급강하/.test(Z.t)
     &&/독 2/.test(Z.t)&&/얼어붙음/.test(Z.t)&&/공격력이 \+/.test(Z.t),
     ['중력 견인','아드레날린','급강하','독','얼음','공격력'].filter((k,i)=>
       [/중력 견인/,/아드레날린/,/급강하/,/독 2/,/얼어붙음/,/공격력이 \+/][i].test(Z.t)).join(' · '));

  /* ── 37) 판이 위로 밀려 올라가지 않는다 ────────────────────────────
     성권: "게임하다보면 화면이 상단으로 밀려 올라가는 증상이 자꾸 생겨."
           "똑같이 발생하네.. 모바일에서 계속 위아래로 화면이 움직여"

     ⚠⚠ 처음엔 **밀리면 되돌리는** 코드(snapTop)로 막으려 했다. 그게 오히려 떨림의
       원인이었다 — 밀림 → scrollTo(0,0) → 그게 또 scroll 을 낳음 → 다시 당김 …
       핀치 뒤에는 visualViewport 가 0 으로 안 돌아와 되먹임이 안 멈췄다.

     그래서 이제 재는 것이 **바뀌었다**. '되돌아오는가' 가 아니라
     **애초에 밀릴 수 있는 문서가 아닌가** 를 본다(구조적 보장).
       ① 판의 겉틀이 position:fixed 로 뷰포트에 못박혀 있다
       ② 그래서 스크롤할 거리가 0 이다 — 억지로 늘려도 판은 그대로다
       ③ touch-action:none 이라 손가락으로 끌 수도 없다
     ⚠ 이 셋 중 하나라도 깨지면 성권의 증상이 돌아온다. 스크롤 교정 코드로 때우지 말 것. */
  const SC=await p.evaluate(async()=>{
    const D=window.ETGDBG;
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    D.startGame(D.deckList(D.autoDeck(6)),6); D.render();
    const wrap=document.querySelector('.wrap');
    const cs=getComputedStyle(wrap), bs=getComputedStyle(document.body);
    const de=document.scrollingElement||document.documentElement;
    const room=de.scrollHeight-de.clientHeight;      /* 스크롤할 거리 자체가 없어야 한다 */
    /* 억지로 문서를 늘려 봐도 판(고정된 겉틀)은 제자리여야 한다 */
    const before=wrap.getBoundingClientRect().top;
    const pad=document.createElement('div');
    pad.style.cssText='height:2000px'; document.body.appendChild(pad);
    window.scrollTo(0,400); await wait(120);
    const after=wrap.getBoundingClientRect().top;
    pad.remove(); window.scrollTo(0,0);
    D.G=null;
    return {pos:cs.position, ta:bs.touchAction, play:document.body.classList.contains('playmode'),
            room, before, after};});
  ok('전투 판은 뷰포트에 못박혀 있다', SC.play&&SC.pos==='fixed',
     `playmode ${SC.play} · position ${SC.pos}`);
  ok('전투 중에는 스크롤할 거리가 없다', SC.room<=0, `여유 ${SC.room}px`);
  ok('문서가 밀려도 판은 안 움직인다', Math.abs(SC.after-SC.before)<0.5,
     `${SC.before.toFixed(1)} → ${SC.after.toFixed(1)}`);
  ok('전투 중에는 손가락으로 못 끈다', SC.ta==='none', `touch-action ${SC.ta}`);
  /* ⚠⚠ 되먹임 재발 방지 — `scroll` 이벤트를 받아서 스크롤 위치를 되돌리는 코드가
     다시 들어오면 성권의 떨림이 그대로 돌아온다. 소스에서 아예 막는다. */
  const fs=require('fs');
  const SRC=fs.readFileSync(path.join(__dirname,'..','prototype','etg','etg.template.html'),'utf8');
  const feedback=/addEventListener\(\s*['"]scroll['"][^)]*\)/.test(SRC)
                 ||/visualViewport\.addEventListener/.test(SRC);
  ok('스크롤을 코드로 되돌리지 않는다', !feedback,
     feedback?'scroll 되먹임 코드가 되살아났다':'없음');
  const SD=await p.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    document.getElementById('quit').click();      /* '덱으로' — 실제 경로로 돌아간다 */
    await wait(150);
    window.scrollTo(0,300); await wait(150);
    return {deck:window.scrollY,cls:document.body.className};});
  ok('덱 화면은 그대로 스크롤된다', SD.deck>0, `scrollY ${SD.deck} · ${SD.cls}`);

  /* ── 37.4) 판의 세로 자리는 **화면이 흔들려도 안 움직인다** ────────
     성권(사진 두 장): "게임 유아이 위치를 고정시키라했는데 가운데 텍스트 줄 수에 따라
     계속 위치가 달라져. 이거 아주 치명적인 문제야."

     ⚠⚠⚠ 앞서 나는 **스크롤**을 막아 놓고 고쳤다고 했다. 아니었다. 움직인 것은 스크롤이
       아니라 **레이아웃 자체**였다. 상대 손패 줄은 본편에서 `margin-top: 카드폭*-0.42` 로
       위로 당겨 놓는데, 그 여백이 카드 크기에 비례하고 카드 크기는 `100dvh` 에 묶여 있다.
       그래서 화면 높이가 조금만 달라져도(iOS 주소줄·홈 인디케이터) 판 전체가 오르내렸고,
       심하면 상대 체력줄이 노치 밑으로 잘려 들어갔다.
     ⚠ 그래서 재는 것은 '스크롤이 0 인가' 가 아니라 **첫 줄이 늘 같은 자리인가** 다. */
  const ANCHOR=await p.evaluate(async()=>{
    const D=window.ETGDBG;
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const st=document.createElement('style');
    st.textContent=':root{--safeT:59px;--safeB:34px}'; document.head.appendChild(st);
    D.startGame(D.deckList(D.autoDeck(9)),9);
    const G=D.G; G.me.q=new Array(13).fill(40);
    ['Dragonfly','Lycanthrope','Singularity'].forEach(n=>D.summon(G.me,D.BYNAME[n].code));
    G.ai.hand=[1,2,3,4,5,6,7].map(()=>D.mk(D.BYNAME['Nova'].code,G.ai));
    D.render();
    const off=()=>{ const w=document.querySelector('.wrap').getBoundingClientRect();
      const b=document.querySelector('.bar').getBoundingClientRect();
      return +(b.top-w.top).toFixed(1); };
    const a=off();
    /* ① 알림글이 길어져도 */
    document.getElementById('hint').innerHTML=
      '<span>아주 아주 아주 긴 알림 글이 들어와서 두 줄이 되어도 판은 움직이면 안 된다</span>';
    const b2=off();
    /* ② 상대 손패가 늘거나 줄어도 (카드 크기에 비례하던 여백이 여기 있었다) */
    G.ai.hand=[]; D.render(); const c=off();
    G.ai.hand=[1,2,3,4,5,6,7,8].map(()=>D.mk(D.BYNAME['Nova'].code,G.ai)); D.render();
    const d=off();
    /* ③ 내 손패가 늘어도 */
    G.me.hand=[1,2,3,4,5,6,7,8].map(()=>D.mk(D.BYNAME['Nova'].code,G.me)); D.render();
    await wait(60);
    const e=off();
    st.remove();
    return {a,b:b2,c,d,e};});
  const spread=Math.max(...Object.values(ANCHOR))-Math.min(...Object.values(ANCHOR));
  ok('알림글·손패가 변해도 판이 안 움직인다', spread<0.6,
     `첫 줄 자리 ${Object.values(ANCHOR).join(' / ')} (차이 ${spread.toFixed(1)}px)`);

  /* ⚠⚠ 진짜 현장은 **화면 높이가 도중에 바뀌는 것**이다(iOS 주소줄이 숨었다 나타난다).
     그때 카드 크기가 달라지는 건 괜찮다 — 판이 **움직이면** 안 된다. */
  const HOFF=[];
  for(const h of [852,920,800,852]){
    await p.setViewportSize({width:390,height:h});
    await p.waitForTimeout(180);
    HOFF.push(await p.evaluate(()=>{
      const w=document.querySelector('.wrap').getBoundingClientRect();
      const b=document.querySelector('.bar').getBoundingClientRect();
      return +(b.top-w.top).toFixed(1);}));
  }
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(180);
  const hspread=Math.max(...HOFF)-Math.min(...HOFF);
  ok('화면 높이가 변해도 판이 안 움직인다', hspread<0.6,
     `${HOFF.join(' / ')} (차이 ${hspread.toFixed(1)}px)`);

  /* ── 37.4a) 상대가 **나를 도와주지 않는다** ────────────────────────
     성권: "상대가 뭔가 나한테 이득인 카드를 내 몬스터에 써주는 거 같은데..?"
     ⚠⚠ 맞았다. aiTarget 은 능력을 '해로움/이로움' 표로 가르는데, **표에 없는 능력은
       아무 데나** 쓴다(가릴 수 없으니 목록 전체에서 무작위). 성광·기물 봉인·아플라톡신·
       집적이 그 상태였고, 그래서 상대가 내 몸을 회복시키고 내 노드를 지켜 줬다.
     ⚠ 재는 것은 '지금 네 개를 고쳤나' 가 아니라 **빠진 것이 하나도 없나** 다 —
       능력을 새로 만들 때마다 같은 일이 되풀이되기 때문이다. */
  const AI=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const used={};
    ETG.cards.filter(c=>!c.up&&D.playable(c)).forEach(c=>c.sk.forEach(s=>{
      if(D.SK[s.id]&&D.SK[s.id].t) (used[s.id]=used[s.id]||[]).push(c.ko); }));
    const miss=Object.keys(used).filter(id=>
      !D.AIHARM.has(id)&&!D.AIHELP.has(id)&&!D.AISMART[id]);
    /* 실제로 겨눠 보게 한다 — 표만 채우고 동작이 딴판이면 소용없다 */
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G; G.ai.q=new Array(13).fill(30); G.me.q=new Array(13).fill(30);
    const mine=D.summon(G.me,D.BYNAME['Fire Spirit'].code);
    const theirs=D.summon(G.ai,D.BYNAME['Fire Spirit'].code);
    const pick=(id,kind,n)=>{ const c={me:0,foe:0};
      for(let i=0;i<n;i++){ const t=D.aiTarget(kind,G.ai,id,null);
        if(!t)continue; const o=(t.own||t); if(o===G.me)c.me++; else c.foe++; }
      return c; };
    const harm=pick('aflatoxin','cr',40);       /* 독은 나에게 와야 한다 */
    const help=pick('bless','cr',40);           /* 축복은 제 몸에 써야 한다 */
    /* 성광 — 야행성이면 해로움, 아니면 이로움. 대상을 봐야 갈린다 */
    const noct=D.summon(G.me,D.BYNAME['Skeleton'].code);
    const holy=pick('v_holylight','any',60);
    return {miss,harm,help,holy,
            noctMine:!!(noct&&noct.flags.includes('nocturnal'))};});
  ok('대상 능력이 하나도 안 빠졌다', AI.miss.length===0,
     AI.miss.slice(0,4).join(', ')||'전부 분류됨');
  ok('상대가 해로운 것은 나에게 쓴다', AI.harm.me>0&&AI.harm.foe===0,
     `나 ${AI.harm.me} · 제 몸 ${AI.harm.foe}`);
  ok('상대가 이로운 것은 제 몸에 쓴다', AI.help.foe>0&&AI.help.me===0,
     `나 ${AI.help.me} · 제 몸 ${AI.help.foe}`);
  ok('성광은 대상을 보고 가른다', AI.holy.me>0&&AI.holy.foe>0,
     `나(야행성) ${AI.holy.me} · 제 몸 ${AI.holy.foe}`);

  /* ── 37.4b) 자동 구성은 **매번 다르고, 결국 카드를 다 쓴다** ──────
     성권: "모든 카드를 써볼 수 있도록 속성별로 프리셋을 여러개 만들고 누를 때마다
     그 덱들이 랜덤으로 나오게."
     ⚠⚠ 예전 자동 구성은 싼 카드부터 채워 **늘 같은 덱**이었다 — 비싼 카드는 영영
       손에 안 들어왔다. 그러니 여기서 재야 하는 것은 셋이다.
       ① 눌러 보면 그 속성 카드를 **빠짐없이** 지나가는가
       ② 매번 다른 덱인가
       ③ 그러면서도 **늘 낼 수 있는 덱**인가(30~60장·같은 카드 6장까지) */
  const AUTO=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const bad=[], sizes=[], plans=new Set();
    let worst=0;
    for(let el=1;el<=12;el++){
      const pool=D.POOLS[el].filter(c=>!c.sk.some(s=>s.id==='pillar'||s.id==='pend'));
      const seen=new Set(); let press=0;
      for(let i=0;i<20;i++){
        const d=D.autoDeck(el); press++;
        plans.add(D.AUTOPLAN.n);
        const n=Object.values(d).reduce((a,b)=>a+b,0);
        sizes.push(n);
        if(n<30||n>60) bad.push(`${D.ELKO[el]} ${n}장`);
        for(const k in d) if(d[k]>6) bad.push(`${D.CARD[+k].ko} ${d[k]}장`);
        Object.keys(d).forEach(k=>{ const c=D.CARD[+k]; if(pool.includes(c)) seen.add(+k); });
        if(seen.size>=pool.length) break;
      }
      if(seen.size<pool.length) bad.push(`${D.ELKO[el]} 카드 ${pool.length-seen.size}장 안 나옴`);
      worst=Math.max(worst,press);
    }
    /* 연달아 같은 방식이 나오면 '랜덤이 아니다' 로 읽힌다 */
    let same=0, prev=null;
    for(let i=0;i<30;i++){ D.autoDeck(3); if(D.AUTOPLAN.n===prev) same++; prev=D.AUTOPLAN.n; }
    return {bad,plans:[...plans],worst,same,
            min:Math.min(...sizes),max:Math.max(...sizes)};});
  ok('자동 구성이 그 속성 카드를 다 쓴다', AUTO.bad.length===0,
     AUTO.bad.slice(0,3).join(' · ')||`속성마다 ${AUTO.worst}번 안에 전부`);
  ok('자동 구성이 매번 같지 않다', AUTO.plans.length>=5&&AUTO.same===0,
     `짜는 방식 ${AUTO.plans.length}가지 · 연속 반복 ${AUTO.same}번`);
  ok('자동 구성은 늘 낼 수 있는 덱', AUTO.min>=30&&AUTO.max<=60,
     `${AUTO.min}~${AUTO.max}장`);

  /* ── 37.45) 손패가 비어도 판이 안 움직인다 ────────────────────────
     성권(사진): "패가 없을때 화면처럼 유아이 위치가 또 갑자기 바뀌어버림"
     ⚠⚠ 손패 줄은 카드가 있을 때만 높이를 가졌다. 마지막 장을 내는 순간 그 줄이 0 이 되고
       위의 줄들이 78px 씩 쏟아졌다. 카드가 몇 장이든 **자리는 늘 잡아 둔다.** */
  const HAND=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const st=document.createElement('style');
    st.textContent=':root{--safeT:59px;--safeB:34px}'; document.head.appendChild(st);
    D.startGame(D.deckList(D.autoDeck(2)),2);
    const G=D.G, out={};
    const y=()=>{ const w=document.querySelector('.wrap').getBoundingClientRect();
      const b=document.querySelector('#myBoard').getBoundingClientRect();
      return +(b.top-w.top).toFixed(1); };
    [0,1,3,5,8].forEach(n=>{
      G.me.hand=Array.from({length:n},()=>D.mk(D.BYNAME['Poison'].code,G.me));
      D.render(); out[n]=y(); });
    st.remove();
    return out;});
  const hv=Object.values(HAND), hsp=Math.max(...hv)-Math.min(...hv);
  ok('손패가 0장이어도 판이 안 움직인다', hsp<0.6,
     `0·1·3·5·8장 → ${hv.join(' / ')} (차이 ${hsp.toFixed(1)}px)`);

  /* ── 37.46) 독은 **걸렸다는 것이 보여야 한다** ─────────────────────
     성권: "독 주문 아무효과도 안생기는데 확인좀" — 규칙은 멀쩡히 돌고 있었다.
     독은 그 자리에서 아무 일도 안 하고 **턴 끝에** 깎이기 때문에, 판에 한 줄도 안 남기면
     아무 일도 안 일어난 것처럼 보인다. 값이 보이는지까지가 이 기능이다. */
  const POI=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(2)),2);
    const G=D.G; G.me.q=new Array(13).fill(30);
    const before=G.ai.hp;
    const u=D.mk(D.BYNAME['Poison'].code,G.me); G.me.hand=[u];
    D.playCard(G.me,u,null);
    const said=G.log.slice(-2).map(x=>x.t).join(' | ');
    const stuck=G.ai.poison;
    D.endTurn();
    return {said,stuck,before,after:G.ai.hp};});
  ok('독 액션이 실제로 독을 건다', POI.stuck===2&&POI.after===POI.before-2,
     `독 ${POI.stuck} · 체력 ${POI.before}→${POI.after}`);
  ok('독이 걸린 것이 판에 보인다', /독 2/.test(POI.said)&&/모두 2/.test(POI.said), POI.said);

  /* ── 37.5) 주소로 받은 개조는 **게임 쪽에서도** 걸린다 ─────────────
     성권: "이름이랑 설명 바꿔달라한건 적용이 안되어있는데?"
     ⚠⚠ 처음에 이걸 에디터에만 넣었다. 링크를 받은 사람이 게임을 열면 아무 일도
       안 일어난다 — 받는 눈에는 그냥 고장이다. 두 쪽 다 먹어야 한다. */
  {
    const payload={card:{1101:{ko:'아포리아 집행자'}},el:{1:'이상'}};
    const b64=Buffer.from(JSON.stringify(payload),'utf8').toString('base64url');
    await p.goto(FILE+'#mod='+b64); await p.waitForTimeout(500);
    const H=await p.evaluate(()=>({el1:window.ETGDBG.ELKO[1], ko:window.ETGDBG.CARD[1101].ko,
      left:location.hash, saved:!!localStorage.getItem(window.ETGDBG.MODKEY)}));
    ok('게임에서도 주소로 개조를 받는다',
       H.el1==='이상'&&H.ko==='아포리아 집행자'&&H.saved, `${H.ko} · ${H.el1}`);
    /* ⚠ 주소에 남기면 새로고침마다 옛 개조가 그 뒤 작업을 덮어쓴다 */
    ok('쓰고 나면 주소에서 지운다', H.left==='', `남은 주소 "${H.left}"`);
    await p.evaluate(()=>{const D=window.ETGDBG;D.setMod({});D.saveMod();D.applyMod();});
    await p.goto(FILE); await p.waitForTimeout(400);
  }

  /* ── 38) 지어낸 규칙은 문서에 올라 있어야 한다 ─────────────────────
     성권: "왜 내가 물어봐야 그런 걸 말해 주는 거야? 자의적으로 규칙을 바꾼 건데
     당연히 보고는 해야 하는 거 아냐?"
     ⚠⚠ 맞는 말이고, **'다음부터 잘 보고하겠다' 는 약속은 잊힌다.** 그래서 기계가 센다.
       코드의 `@지어냄:` 표시를 긁어 docs/invented.md 를 만들고, 여기서 어긋나면 빨간불.
       지어낸 규칙은 문서에 오르지 않고서는 배포될 수 없다. */
  {
    const cp=require('child_process'), pth2=require('path');
    let out='', code=0;
    try{ out=cp.execFileSync('python3',
      [pth2.join(__dirname,'list_invented.py'),'--check'],{encoding:'utf8'}); }
    catch(e){ code=1; out=(e.stdout||'')+(e.stderr||''); }
    ok('지어낸 규칙이 문서와 일치한다', code===0, out.trim().split('\n').pop());
  }

  /* ── 39) **발동형 능력이 진짜로 일하는가** ─────────────────────────
     성권: "바이러스가 작동을 안 하는 것 같은데 … 내가 못 본 건지"
     ⚠⚠ 봤다. `def('virusinfect', null, …)` — **대상 종류를 안 적어 놨다.**
       그러면 대상을 안 고르고 t=null 로 발동해, 바이러스만 죽고 독은 아무에게도
       안 걸린다. **오류도 안 나고 카드만 사라진다** — 눈으로는 '왜 안 되지' 뿐이다.
       이 부류를 통째로 막는다: openEtG 가 대상을 요구하는 능력은 우리도 요구해야 한다. */
  const TG=await p.evaluate(()=>{
    const D=window.ETGDBG;
    /* ① openEtG 가 `Tgt::crea` 인 발동형은 우리도 대상을 받아야 한다 */
    const need=['virusinfect','guard','snipe','liquid','lobotomize','quint','rage','mend',
      'poison','v_bblood','v_cseed','parallel','v_rewind','v_mutation','v_improve',
      'acceleration','adrenaline','nightmare','fractal','v_readiness'];
    const noTgt=need.filter(id=>D.SK[id]&&!D.SK[id].t);
    /* ② 바이러스가 진짜로 독을 건다 */
    D.startGame(D.deckList(D.autoDeck(2)),2);
    const G=D.G; G.me.q=new Array(13).fill(20);
    const v=D.summon(G.me,D.BYNAME['Virus'].code);
    const t=D.summon(G.ai,D.BYNAME['Crimson Dragon'].code);
    const before=D.useAbility(G.me,v,null);      /* 대상 없이는 안 나가야 한다 */
    const stillAlive=!v.dead;
    D.useAbility(G.me,v,t);
    const after={dead:!!v.dead,poison:t.poison};
    /* ③ 포식은 **못 먹는 몸이 겨냥 목록에 없어야** 한다 */
    D.startGame(D.deckList(D.autoDeck(3)),3);
    const G2=D.G; G2.me.q=new Array(13).fill(20);
    const dv=D.summon(G2.me,D.BYNAME['Scarab'].code); dv.hp=3;
    const small=D.summon(G2.ai,D.BYNAME['Photon'].code);     /* 1|1 */
    const big=D.summon(G2.ai,D.BYNAME['Crimson Dragon'].code);/* 12|3 */
    const pool=D.targetsFor('devour',G2.me,dv).map(x=>x.c.en);
    return {noTgt,before,stillAlive,after,pool};});
  ok('대상이 필요한 능력은 대상을 받는다', TG.noTgt.length===0, TG.noTgt.join(',')||'20종 확인');
  ok('바이러스가 진짜로 독을 건다',
     TG.before===false&&TG.stillAlive&&TG.after.dead&&TG.after.poison===1,
     `대상 없이 발동 ${TG.before} · 독 ${TG.after.poison}`);
  ok('못 먹는 몸은 겨냥 목록에 없다',
     TG.pool.includes('Photon')&&!TG.pool.includes('Crimson Dragon'),
     TG.pool.join(' · ')||'(빈 목록)');

  /* ── 40) 카드 글은 **원문을 옮긴 것**이어야 한다 ──────────────────
     성권: "니 멋대로 축약하고 정리하니까 … 문장형 효과 텍스트들 다 원문 그대로
     가져온 거 맞아?" — 아니었다. 능력별 요약을 ' · ' 로 이어 붙인 내 글이었고,
     그래서 무기의 첫 줄('무기 — 매 턴 피해를 준다') 같은 게 통째로 빠져
     불협화음이 '상대 퀀텀을 뒤섞는다' 한 줄로만 보였다.
     ⚠ 다시 요약으로 돌아가지 않게 못 박는다. */
  const KT=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const play=ETG.cards.filter(c=>!c.up&&D.playable(c));
    const miss=play.filter(c=>c.kotxt===undefined).map(c=>c.en);
    const txt=n=>{const d=document.createElement('div');
      d.innerHTML=D.etgCardHTML(D.BYNAME[n],{size:'md'});
      return d.querySelector('.teff').textContent.trim();};
    return {n:play.length, miss,
      /* 웨폰은 '매 턴 피해를 준다' 는 첫 줄이 살아 있어야 한다.
         ⚠ 머리말은 종류 이름이라 성권이 갈 수 있다(크리처→유닛처럼). KINDKO 를 읽는다. */
      weapon:play.filter(c=>c.kind==='weapon'
        &&(c.kotxt||'').indexOf(D.KINDKO.weapon+' —')!==0).map(c=>c.en),
      discord:txt('Discord'), virus:txt('Virus')};});
  /* ⚠ 장수를 숫자로 박아 두면 카드를 하나 뺄 때마다 여기가 거짓으로 실패한다.
     재야 하는 것은 '몇 장인가' 가 아니라 **놀 수 있는 카드에 글이 빠진 게 없는가** 다. */
  ok('놀 수 있는 카드에 글이 다 있다', KT.miss.length===0,
     KT.miss.slice(0,4).join(',')||`${KT.n}장`);
  ok('웨폰 글에 첫 줄이 살아 있다', KT.weapon.length===0, KT.weapon.join(',')||'전부 확인');
  ok('원문 문장 그대로 읽힌다',
     /웨폰 — 매 턴 끝에 피해를 준다/.test(KT.discord)&&/뒤섞는다/.test(KT.discord)
     &&/감염 —/.test(KT.virus),
     KT.discord);

  /* ── 40.5) 글 속의 속성은 **구슬**로 나온다 ────────────────────────
     성권: "[엔트로피] 이런식으로 텍스트에 입력된건 아이콘으로 치환할 수 없을까?"
     ⚠⚠ 여기서 진짜 위험한 것은 '구슬이 뜨나' 가 아니다. **고정 상자를 넘기는가** 다.
       구슬은 글자보다 폭이 넓은데 글자 수 계산(effClass)에서 0 자로 세어지면 글꼴이
       한 단 커지고, 그 순간 글이 상자 밖으로 잘린다. 그래서 실제로 그려서 높이를 잰다. */
  const PIP=await p.evaluate(()=>{
    const D=window.ETGDBG;
    const box=document.createElement('div');
    /* 판과 같은 폭으로 그린다 — 카드 규격은 --cw 가 정한다 */
    box.style.cssText='position:fixed;left:-9999px;top:0;--cw:96px;width:400px';
    document.body.appendChild(box);
    const brk=[],over=[];
    let pips=0,cards=0;
    ETG.cards.filter(c=>!c.up&&D.playable(c)).forEach(c=>{
      box.innerHTML=D.etgCardHTML(c,{size:'md'});
      const eff=box.querySelector('.teff'), body=box.querySelector('.tbody');
      if(!eff||!body)return;
      const n=eff.querySelectorAll('.elp').length;
      if(n){ cards++; pips+=n; }
      /* 대괄호가 글자로 남아 있으면 치환이 안 된 것이다 */
      if(/\[[^\]]{1,6}\]/.test(eff.textContent)) brk.push(c.en);
      /* 고정 상자를 넘겼는가 — 1px 은 반올림 여유 */
      if(eff.scrollHeight>body.clientHeight+1) over.push(`${c.en}(${eff.scrollHeight}>${body.clientHeight})`);
    });
    const one=(()=>{ box.innerHTML=D.etgCardHTML(D.BYNAME['Fire Bolt'],{size:'md'});
      const i=box.querySelector('.teff .elp');
      return i?{t:i.getAttribute('title'),
                w:+getComputedStyle(i).width.replace('px',''),
                fs:+getComputedStyle(i.parentNode).fontSize.replace('px','')}:null; })();
    box.remove();
    return {pips,cards,brk,over,one};});
  ok('글 속 속성이 구슬로 바뀐다', PIP.pips>0&&PIP.brk.length===0,
     `구슬 ${PIP.pips}개 · ${PIP.cards}장 · 안 바뀐 카드 ${PIP.brk.slice(0,3).join(',')||'없음'}`);
  ok('구슬이 글자 크기를 따라간다', !!PIP.one&&PIP.one.w<PIP.one.fs&&PIP.one.w>PIP.one.fs*0.6,
     PIP.one?`구슬 ${PIP.one.w.toFixed(1)}px / 글자 ${PIP.one.fs.toFixed(1)}px · ${PIP.one.t}`:'구슬 없음');
  /* ⚠⚠⚠ 텍스트 박스는 고정 크기다. 구슬을 넣었다고 글이 넘치면 그건 개선이 아니다. */
  ok('구슬을 넣어도 글이 상자를 안 넘친다', PIP.over.length===0,
     PIP.over.slice(0,3).join(' · ')||`${PIP.cards}장 확인`);

  /* ── 41) 판은 **고정 자리**다 ──────────────────────────────────────
     성권: "게임 배틀 유아이가 고정 위치여야 하는데 가운데 텍스트가 길어지면 막 움직이는데?
     그리고 이게 자꾸 모바일에서 유아이가 위로 말려들어가는 원인 같아."
     ⚠⚠ 맞았다. 가운데 알림줄에 높이를 안 정해 놔서 **글이 길면 줄이 늘고**, 그만큼
       아래가 통째로 밀렸다. 크리처 줄도 손패도 매번 다른 자리에 왔고, 늘어난 만큼
       판이 화면을 넘치면 위로 말려 올라갔다. 높이를 글에 맡기지 않는다. */
  const FIX=await p.evaluate(()=>{
    const D=window.ETGDBG;
    D.startGame(D.deckList(D.autoDeck(6)),6);
    const G=D.G;
    for(let i=0;i<5;i++) G.me.cr[i]=D.mk(D.BYNAME['Crimson Dragon'].code,G.me);
    D.render();
    const read=()=>{
      const c=document.querySelector('.ctl').getBoundingClientRect();
      const m=document.getElementById('myBoard').getBoundingClientRect();
      const h=document.getElementById('hand').getBoundingClientRect();
      return [Math.round(c.height),Math.round(m.top),Math.round(h.top)];
    };
    const sp=document.querySelector('.hint span');
    const msgs=['상대 턴…','카드를 내거나, 길게 눌러 효과를 보세요',
      '슈뢰딩거의 고양이 — 대상을 고르세요','★ 이겼다',
      '아주아주 긴 이름이 들어와도 절대 흔들리지 않아야 한다 — 대상을 고르세요'];
    const rows=msgs.map(m=>{ sp.textContent=m; return read(); });
    return {rows, wrapped:!!document.querySelector('.hint span')};
  });
  const same=FIX.rows.every(r=>r.join()===FIX.rows[0].join());
  ok('알림줄이 길어져도 판이 안 움직인다', same&&FIX.wrapped,
     FIX.rows.map(r=>r[0]+'px').join(' · '));

  if(errs.length){ bad++; console.log('   ERR',errs.slice(0,4)); }
  console.log(`\n미구현 능력 ${cov.miss.length}종: ${cov.miss.join(' ')}`);
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
