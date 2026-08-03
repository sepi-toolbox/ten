/* 겁화룡 이그니스(보스) — 개전 넷 · 얼굴 무적 · 그 몸이 곧 목숨
 *   node tools/test_ignis.js
 *
 * 여기서 엔진이 새로 배운 것 넷:
 *   홍염     : 같은 카드 넷이 **개전**으로 판에 깔린 채 시작한다 · 죽으면서 적 판을 훑는다
 *   이그니스  : 서 있는 동안 **얼굴 피해가 전부 0** 이 되고, 이 몸이 죽으면 그 자리에서 진다
 *   HP 조건  : 카드 자신이 '내 HP 20 이하에서만' 이라는 사용 조건을 건다
 *   용의 숨결 : 상대 **전체**에 심는 부여 — 대상을 안 고른다
 * 그리고 무엇보다 **AI 가 제 목숨을 스스로 갈아 넣지 않는가**(깃털·도화선·분신·전차).
 */
const path=require('path'), fs=require('fs');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const ROOT=path.join(__dirname,'..');
const P='file://'+path.join(ROOT,'prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(24)+' '+d); };

  const pool=JSON.parse(fs.readFileSync(path.join(ROOT,'data','cards.json'),'utf8')).pool;
  ok('신규 3종 = 적 전용', ['홍염','이그니스','용의 숨결'].every(n=>pool[n]&&pool[n].foe===1),
     `홍염 ${pool['홍염'].a}/${pool['홍염'].h} · 이그니스 ${pool['이그니스'].a}/${pool['이그니스'].h}`
     +` · 용의 숨결 ${pool['용의 숨결'].c}코`);
  const foes=JSON.parse(fs.readFileSync(path.join(ROOT,'data','enemies.json'),'utf8')).list;
  const ig=foes.find(e=>e.id==='fire_ignis');
  const nm=ig.decks[0].map(x=>x[0]);
  ok('보스 고정 덱 23장', !!ig.fixed&&ig.decks[0].reduce((s,x)=>s+x[1],0)===23
     &&ig.decks[0].find(x=>x[0]==='홍염')[1]===4&&ig.opener==='화염의 원천'
     &&nm.every(n=>!/^강화 /.test(n)),
     `${nm.length}종 — ${nm.join(' · ')}`);

  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  await p.evaluate(()=>{const k=document.getElementById('keepBtn');k&&k.click();});
  await p.waitForTimeout(400);

  const R=await p.evaluate(async()=>{
    SPEED=40; const o={};
    const reset=()=>{S.me.board=[];S.ai.board=[];S.me.hp=60;S.ai.hp=60;S.me.hand=[];
      S.me.lands=[];S.ai.lands=[];S.me.deck=[];S.ai.deck=[];
      S.dead=0;S.over=false;S.busy=false;S.sel=null;S.mode=null;};
    const put=(pl,n)=>{const i=S[pl].board.length;placeCreature(pl,n,i);onSummon(pl,n,i);};
    const hp=(pl,i)=>{const u=S[pl].board[i];return u&&u.insts[0]?u.insts[0].hp:0;};

    /* 홍염 — 개전 넷이 깔린 채로 시작 */
    reset();
    S.ai.deck=['홍염','홍염','홍염','홍염','용암거인','화산'];
    openingStep();
    o.홍염={판:S.ai.board.filter(Boolean).map(u=>u.name), 덱:S.ai.deck.slice(),
            스탯:S.ai.board[0]&&`${S.ai.board[0].a}/${hp('ai',0)}`, 연소:S.ai.board[0].burn};
    /* 죽으면 적 판을 훑는다 */
    reset(); put('ai','홍염'); ['화염정령','검사'].forEach(n=>put('me',n));
    const t0=[hp('me',0),hp('me',1)];
    S.ai.board[0].insts[0].hp=0; cleanup('ai');
    o.홍염폭발={전:t0, 후:[hp('me',0),hp('me',1)]};

    /* 용의 숨결 — 상대 전체에 연소 4, 대상 지정 없음 */
    reset(); ['화염정령','검사'].forEach(n=>put('me',n));
    o.숨결={모드:modeOf('용의 숨결'), 전:S.me.board.map(u=>u.burn||0)};
    resolveInstant('ai','용의 숨결');
    o.숨결.후=S.me.board.map(u=>u.burn||0);

    /* 이그니스 — HP 조건 · 얼굴 무적 · 죽으면 즉시 패배 */
    reset();
    S.ai.lands=Array(9).fill(0).map(()=>({name:'화산',els:['fire'],used:false,entering:false}));
    o.조건={HP60:canPay('ai','이그니스')};
    S.ai.hp=20; o.조건.HP20=canPay('ai','이그니스');
    put('ai','이그니스');
    const f0=S.ai.hp;
    faceDmg('ai',15);                            /* 얼굴 피해 — 전부 0 이 된다 */
    put('me','겁화룡'); resolveAttacksFake=null;
    o.무적={전:f0, 후:S.ai.hp};
    /* 폭발도 막힌다 */
    put('me','고블린 폭탄병');
    S.me.board[S.me.board.length-1].insts[0].hp=0; cleanup('me');
    o.무적.폭발뒤=S.ai.hp;
    /* 그 몸이 죽으면 그 자리에서 진다 */
    const ix=S.ai.board.findIndex(u=>u&&u.name==='이그니스');
    S.ai.board[ix].insts[0].hp=0; cleanup('ai');
    o.패배=S.ai.hp;
    return o;
  });

  ok('홍염 = 개전 넷', R.홍염.판.join()==='홍염,홍염,홍염,홍염'
     &&!R.홍염.덱.includes('홍염')&&R.홍염.스탯==='0/3'&&R.홍염.연소===1,
     `시작부터 ${R.홍염.판.length}개체 (${R.홍염.스탯} 연소 ${R.홍염.연소}) · 덱에는 안 남는다`);
  ok('홍염 = 죽으며 적 전체 3', R.홍염폭발.후[0]===R.홍염폭발.전[0]-3
     &&R.홍염폭발.후[1]===R.홍염폭발.전[1]-3,
     `화염정령 ${R.홍염폭발.전[0]}→${R.홍염폭발.후[0]} · 검사 ${R.홍염폭발.전[1]}→${R.홍염폭발.후[1]}`);
  ok('용의 숨결 = 전체 부여', R.숨결.모드==='instant'
     &&R.숨결.후[0]===R.숨결.전[0]+4&&R.숨결.후[1]===R.숨결.전[1]+4,
     `modeOf ${R.숨결.모드} · 연소 ${R.숨결.전.join('/')} → ${R.숨결.후.join('/')}`);
  ok('이그니스 = HP 조건', R.조건.HP60===false&&R.조건.HP20===true,
     'HP 60 에서는 못 내고 20 이 되어야 낸다');
  ok('이그니스 = 얼굴 무적', R.무적.전===R.무적.후&&R.무적.폭발뒤===R.무적.전,
     `얼굴 15 · 폭발까지 전부 0 (HP ${R.무적.전} 그대로)`);
  ok('이그니스 소멸 = 패배', R.패배===0, `그 몸이 죽자 HP ${R.패배}`);

  /* ── AI 가 제 목숨을 갈아 넣지 않는가 ───────────────────────── */
  const A=await p.evaluate(async()=>{
    SPEED=60; const o={};
    const setup=(hand,board)=>{
      S.ai.hand=hand.slice(); S.ai.deck=['검사','창병','석벽']; S.ai.board=[]; S.me.board=[];
      S.ai.lands=Array(9).fill(0).map(()=>({name:'화산',els:['fire'],used:false,entering:false}));
      S.ai.landPlayed=true; S.over=false; S.ai.hp=20; S.me.hp=60; S.dead=0;
      board.forEach(n=>placeCreature('ai',n,S.ai.board.length));
    };
    const alive=()=>!!S.ai.board.find(u=>u&&u.name==='이그니스');
    /* 깃털 — 제물이 이그니스뿐이면 아예 안 쓴다 */
    setup(['불사조의 깃털'],['이그니스']);
    await aiTurn();
    o.깃털={손:S.ai.hand.length, 이그니스:alive()};
    /* 다른 몸이 있으면 그쪽을 제물로 */
    setup(['불사조의 깃털'],['이그니스','불씨정령']);
    await aiTurn();
    o.깃털2={이그니스:alive(), 판:S.ai.board.filter(Boolean).map(u=>u.name)};
    /* 도화선 — 연소를 얹으면 천천히 자살이다. 이그니스에는 안 붙인다 */
    setup(['도화선'],['이그니스','와이번']);
    await aiTurn();
    o.도화선={이그니스연소:(S.ai.board.find(u=>u&&u.name==='이그니스')||{}).burn||0,
              와이번연소:(S.ai.board.find(u=>u&&u.name==='와이번')||{}).burn||0};
    /* 분신 — 태울 몸으로도 안 고른다 */
    setup([],['이그니스','불씨정령']);
    const v=aoeVal('ai','분신');
    o.분신={값:v, 이그니스:alive(), 판:S.ai.board.filter(Boolean).map(u=>u.name)};
    /* 전차 — 삼킬 대상으로도 안 고른다 */
    setup([],['이그니스','불씨정령']);
    placeCreature('ai','고블린 전차',S.ai.board.length);
    onSummon('ai','고블린 전차',S.ai.board.length-1);
    o.전차={삼킴:(S.ai.board.find(u=>u&&u.ate)||{}).ate, 이그니스:alive()};
    /* 판이 꽉 차 있어도 **자리를 만들어서** 낸다 — 안 그러면 2단계가 통째로 안 열린다 */
    setup(['이그니스'],[]);
    for(let i=0;i<10;i++)placeCreature('ai','불씨정령',S.ai.board.length);
    await aiTurn();
    /* ⚠ aiTurn 은 끝에 endTurn() 을 **기다리지 않고** 부른다 → 그 뒤에 상대 턴이 시작되며
       카드를 한 장 더 뽑는다. 그래서 손패 **장수**가 아니라 '그 카드가 아직 손에 있나' 로 본다. */
    o.보루={이그니스:alive(), 패:S.ai.hand.slice(), 칸:S.ai.board.filter(Boolean).length};
    /* HP 조건이 아직이면 자리를 비우지도 않는다 */
    setup(['이그니스'],[]); S.ai.hp=60;
    for(let i=0;i<10;i++)placeCreature('ai','불씨정령',S.ai.board.length);
    await aiTurn();
    o.아직={이그니스:alive(), 손:S.ai.hand.length, 칸:S.ai.board.filter(Boolean).length,
            패:S.ai.hand.slice(), 판:S.ai.board.filter(Boolean).map(u=>u.name).join()};
    return o;
  });
  ok('AI — 자리를 만들어 낸다', A.보루.이그니스&&!A.보루.패.includes('이그니스')&&A.보루.칸===10,
     `꽉 찬 판에서 제일 값 안 나가는 몸을 물리고 세운다 (${A.보루.칸}칸)`);
  ok('AI — HP 조건 전엔 안 낸다', !A.아직.이그니스&&A.아직.패.includes('이그니스')&&A.아직.칸===10,
     `이그니스 ${A.아직.이그니스} · 패 [${A.아직.패}] · 칸 ${A.아직.칸} · 판 ${A.아직.판}`);
  ok('AI — 깃털을 안 쓴다', A.깃털.손===1&&A.깃털.이그니스,
     '제물이 이그니스뿐이면 카드를 아낀다');
  ok('AI — 다른 몸을 제물로', A.깃털2.이그니스&&!A.깃털2.판.includes('불씨정령'),
     `제물은 불씨정령 · 남은 판 [${A.깃털2.판.join()}]`);
  ok('AI — 도화선도 피한다', A.도화선.이그니스연소===0&&A.도화선.와이번연소===5,
     `이그니스 연소 ${A.도화선.이그니스연소} · 와이번 연소 ${A.도화선.와이번연소}`);
  ok('AI — 분신 제물도 피한다', A.분신.이그니스&&!A.분신.판.includes('불씨정령')&&A.분신.값===3,
     `태운 몸은 불씨정령(ATK ${A.분신.값}) — 이그니스는 남는다`);
  ok('AI — 전차도 안 삼킨다', A.전차.삼킴==='불씨정령'&&A.전차.이그니스,
     `삼킨 것 ${A.전차.삼킴}`);

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
