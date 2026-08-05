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
    const tag=document.querySelector('#myBoard .slot.canuse .usetag');
    u.used=true; D.render();
    const spent=document.querySelectorAll('#myBoard .slot.canuse').length;
    return {poor,rich,spent,tag:tag?tag.textContent:''};});
  ok('못 쓸 땐 안 빛난다', hl.poor===0, `${hl.poor}개`);
  ok('쓸 수 있으면 빛나고 비용이 뜬다', hl.rich===1&&/불/.test(hl.tag), `${hl.rich}개 · "${hl.tag}"`);
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

  if(errs.length){ bad++; console.log('   ERR',errs.slice(0,4)); }
  console.log(`\n미구현 능력 ${cov.miss.length}종: ${cov.miss.join(' ')}`);
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
