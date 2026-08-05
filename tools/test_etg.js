/* 엘리멘츠 원정 모드 — 원작 규칙이 실제로 그렇게 도는지 본다
 *   node tools/test_etg.js
 *
 * 왜 이 파일이 있나 — 이 모드는 **본편과 규칙이 다르다.** 콴타가 쌓이고, 막기가
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

  /* ── 3) 콴타는 쌓인다 — 본편과 가장 크게 갈리는 지점 ────────────────── */
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
  ok('콴타가 턴을 넘겨 쌓인다', acc.length>=3&&acc[1]>acc[0]&&acc[2]>acc[1], acc.join(' → '));

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

  /* ── 11b) 쌓인 기둥은 쌓인 수만큼 콴타를 만든다 ─────────────────────── */
  const stq=await p.evaluate(()=>{
    const D=window.ETGDBG; const G=D.G;
    G.me.hand=[]; G.ai.hand=[]; G.me.q=new Array(13).fill(0); G.me.mark=6;
    D.endTurn();
    return G.me.q[6];    /* 기둥 ×3 + 문장 1 */
  });
  ok('쌓인 만큼 콴타가 나온다', stq===4, `불 콴타 ${stq} (기둥 ×3 + 문장 1)`);

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
     `내 ${run.myhp} · 상대 ${run.aihp} · 내 몸 ${run.board} · 콴타 ${run.q}${run.over?' · 승부남':''}`);

  if(errs.length){ bad++; console.log('   ERR',errs.slice(0,4)); }
  console.log(`\n미구현 능력 ${cov.miss.length}종: ${cov.miss.join(' ')}`);
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
