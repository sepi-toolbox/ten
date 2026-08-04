/* 크리처 키워드 엔진 — 2026-08 전면 개정판 규칙을 검사한다.
 *   node tools/test_keywords.js
 *
 * ⚠ 정본은 tools/gen_decks.py 의 KW(예산)와 build_proto_data.py 의 GLOSSARY(규칙문)다.
 *    여기서 검사하는 것은 **프로토타입 엔진이 그 규칙대로 도는가** 하나뿐이다.
 * ⚠ 카드 이름을 하드코딩하지 말고 '그 키워드를 가진 첫 카드'를 찾아 쓴다 —
 *    밸런스 조정으로 스탯이 바뀌어도 테스트가 안 깨진다.
 */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1100,height:1200}});
  const errs=[]; p.on('pageerror',e=>errs.push('ERR: '+e.message));
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(800);
  await p.click('#keepBtn').catch(()=>{}); await p.waitForTimeout(250);

  const R=await p.evaluate(async()=>{
    SPEED=40;
    const out=[]; const ok=(k,pass,detail)=>out.push({k,pass,detail});
    const reset=()=>{ S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[];
      S.me.hp=60; S.ai.hp=60; S.me.maxhp=60; S.ai.maxhp=60;
      S.me.hand=[]; S.ai.hand=[]; S.me.noecho={}; S.ai.noecho={};
      S.over=false; S.busy=false; S.tide=null; };
    const put=(pl,n,i)=>{ placeCreature(pl,n,i); onSummon(pl,n,i); };
    const hp=(pl,i)=>{ const u=S[pl].board[i]; return u&&u.insts[0]?u.insts[0].hp:null; };
    /* 조건에 맞는 카드 한 장 찾기 — 덱에 실제로 실린 것만(강화·상위 몸 제외) */
    const find=f=>Object.keys(POOL).find(n=>{ const c=POOL[n];
      return c.k==='cr'&&!c.over&&!c.grown&&f(c,n); });
    const kw=(k)=>find(c=>(c.kw||'').includes(k));

    // 1) 연소 N — 매 턴 종료 시 **자신이** N 피해
    reset();
    const nBurn=kw('연소'); put('me',nBurn,0);
    const b0=hp('me',0), bn=S.me.board[0].burn;
    endStep('me');
    const b1=S.me.board[0]?hp('me',0):0;
    ok('연소 = 자해', b1===b0-bn, `${nBurn} 연소 ${bn} — HP ${b0} → ${b1}`);

    // 1-b) 연소는 체력이 다하면 스스로 죽는다
    reset(); put('me',nBurn,0);
    let t=0; while(S.me.board[0]&&t<12){ endStep('me'); t++; }
    ok('연소 = 유한한 수명', !S.me.board[0]&&t<=12, `${t}턴 만에 소멸 (체력 ${b0} / 연소 ${bn})`);

    // 2) 폭발 N — 소멸 시 **상대 플레이어**에게 N (적 크리처는 멀쩡하다)
    reset();
    const nBoom=kw('폭발'); put('me',nBoom,0);
    const other=find(c=>!(c.kw||'').includes('폭발')&&c.h>=4);
    put('ai',other,0);
    const foeHp0=S.ai.hp, foeCr0=hp('ai',0), v=S.me.board[0].a;
    S.me.board[0].insts[0].hp=0; cleanup('me');
    ok('폭발 = ATK 만큼 얼굴', S.ai.hp===foeHp0-v&&hp('ai',0)===foeCr0,
       `${nBoom} ATK ${v} — 상대 HP ${foeHp0}→${S.ai.hp} · 적 크리처 ${foeCr0} 그대로`);
    /* 2-b) 수치가 카드에 없다 = **죽는 시점의 ATK**. 연마로 커진 값이 그대로 들어간다. */
    reset(); put('me',nBoom,0);
    S.me.board[0].a+=4; const grown=S.me.board[0].a, fh=S.ai.hp;
    S.me.board[0].insts[0].hp=0; cleanup('me');
    ok('폭발 = 커진 ATK 반영', S.ai.hp===fh-grown, `ATK +4 → 폭발 ${grown} (HP ${fh}→${S.ai.hp})`);

    // 3) 환류 — 손으로 돌아오지만 **그 능력은 소진**된다
    reset();
    const nEcho=kw('환류'); put('me',nEcho,0);
    S.me.board[0].insts[0].hp=0; cleanup('me');
    const back=S.me.hand.filter(x=>x===nEcho).length;
    placeCreature('me',nEcho,0);
    ok('환류 = 1회', back===1&&S.me.board[0].echo===false,
       `${nEcho} — 손으로 ${back}장 · 재소환 시 환류 ${S.me.board[0].echo}`);

    // 4) 밀물 — 내 쪽은 **반드시 고르게** 하고, 대상이 없으면 그냥 소환된다
    reset();
    const nTide=kw('밀물'); const tc=POOL[nTide].c;
    const small=find(c=>c.c<=tc), big=find(c=>c.c>tc);
    put('ai',small,0);
    put('me',nTide,0);
    const waiting=!!S.tide, list=S.tide?S.tide.list.slice():[];
    if(S.tide)tideBounce('me',S.tide.list[0]);
    ok('밀물 = 대상 지정', waiting&&list.length===1&&!S.ai.board.filter(Boolean).length,
       `${nTide}(${tc}코) → ${small}(${POOL[small].c}코) 지정 후 손으로`);
    reset(); put('ai',big,0); put('me',nTide,0);
    ok('밀물 = 대상 없으면 통과', !S.tide&&S.ai.board.filter(Boolean).length===1,
       `${big}(${POOL[big].c}코)는 ${tc}코 이하가 아니라 후보 아님`);

    // 5) 증식 — **한 번만** 복제하고 능력이 사라진다
    reset();
    const nBreed=kw('증식'); put('me',nBreed,0);
    endStep('me'); const n1=S.me.board.filter(Boolean).length;
    endStep('me'); const n2=S.me.board.filter(Boolean).length;
    ok('증식 = 1회', n1===2&&n2===2&&S.me.board[0].breed===false,
       `${nBreed} — 1턴 ${n1}개체 → 2턴 ${n2}개체 (더 늘지 않는다)`);

    // 6) 성장 N — N턴 뒤 상위 몸으로 교체
    reset();
    const nGrow=kw('성장'); put('me',nGrow,0);
    const gn=S.me.board[0].grow.left, to=S.me.board[0].grow.to;
    for(let i=0;i<gn;i++)endStep('me');
    ok('성장 = 변신', S.me.board[0]&&S.me.board[0].name===to&&POOL[to].grown===1,
       `${nGrow} 성장 ${gn} → ${S.me.board[0]&&S.me.board[0].name}`);

    // 6-b) 상위 몸은 덱·카드 목록에 없다 (필드에서만 나온다)
    ok('상위 몸은 덱 밖', Object.values(DECKS).every(d=>!(d.list||[]).some(([x])=>(POOL[x]||{}).grown)),
       `${Object.keys(GROWN).length}종 — 어느 덱에도 안 실림`);

    // 7) 진형 — 내 크리처가 **나 하나뿐일 때** 각성
    reset();
    const nForm=kw('진형'); put('me',nForm,0); put('me',other,1);
    endStep('me');
    const notYet=S.me.board[0].name===nForm;
    S.me.board=[S.me.board[0]]; endStep('me');
    ok('진형 = 혼자면 각성', notYet&&/^각성한 /.test(S.me.board[0].name),
       `둘일 땐 그대로 → 혼자 남자 ${S.me.board[0].name}`);

    // 8) 육중 — 소환한 턴에는 공격하지 않는다
    reset();
    const nHeavy=kw('육중'); put('me',nHeavy,0);
    const sick0=S.me.board[0].sick;
    const foe0=S.ai.hp; await resolveAttacks('me');
    const held=S.ai.hp===foe0;
    startTurn('me'); const sick1=S.me.board[0].sick;
    ok('육중 = 소환 멀미', sick0&&held&&!sick1,
       `${nHeavy} — 소환 턴 공격 없음(상대 HP ${foe0} 유지) · 내 턴 시작에 해제`);

    // 9) 연마 — 상한 없이 ATK +1
    reset();
    const nHone=kw('연마'); put('me',nHone,0);
    const a0=S.me.board[0].a;
    for(let i=0;i<6;i++)endStep('me');
    ok('연마 = 무제한', S.me.board[0]&&S.me.board[0].a===a0+6,
       `${nHone} ATK ${a0} → ${S.me.board[0]&&S.me.board[0].a} (6턴)`);

    // 10) 경화 N — 받는 피해 −N
    reset();
    const nHard=kw('경화'); put('me',nHard,0);
    const u=S.me.board[0], hd=u.hard, before=hp('me',0);
    const dealt=hurt(u,u.insts[0],5);
    ok('경화 = 피해 감소', dealt===5-hd&&hp('me',0)===before-(5-hd),
       `${nHard} 경화 ${hd} — 5 피해가 ${dealt} 로`);

    // 11) 가호 — 처음 받는 **피해**를 통째로 무효 (파괴가 아니라 피해)
    reset();
    const nWard=kw('가호'); put('me',nWard,0);
    const w=S.me.board[0], h0=hp('me',0);
    const d1=hurt(w,w.insts[0],99);
    const kept=hp('me',0)===h0&&w.ward===false;
    const d2=hurt(w,w.insts[0],2);
    ok('가호 = 첫 피해 무효', d1===0&&kept&&d2===2,
       `${nWard} — 99 피해 무효(HP ${h0} 유지) → 다음 2 피해는 그대로`);

    // 12) 제물 N — 소환 시 내 HP 지불 / 축복 N — 회복
    //  ⚠ 2026-08 '대가' → **제물** 개명. 이 검사가 옛 이름으로 카드를 찾다가 undefined 를
    //    집어 `POOL[undefined].kw` 에서 **통째로 크래시**하고 있었다(빨간불이 아니라 크래시라
    //    로그에 ❌ 가 안 찍혀서 오래 눈에 안 띄었다).
    reset();
    const nCost=kw('제물'), nBless=kw('축복');
    if(!nCost||!nBless){
      ok('제물·축복', false, `카드를 못 찾았다 (제물=${nCost} 축복=${nBless})`);
    }else{
      const c0=S.me.hp; put('me',nCost,0);
      const paid=c0-S.me.hp;
      S.me.hp=30; put('me',nBless,1);
      ok('제물·축복', paid===+((POOL[nCost].kw.match(/제물 (\d+)/)||[])[1])&&S.me.hp>30,
         `${nCost} HP −${paid} · ${nBless} HP 30 → ${S.me.hp}`);
    }

    // 13) 흡혈 — 입힌 피해의 **절반**만큼, 본체가 아니라 **그 크리처 자신**이 회복
    //  ⚠ 2026-08 회복 대상이 본체 → 자기 자신으로 바뀌었다. 최대 체력을 넘지 않는다.
    reset();
    const nDrain=kw('흡혈'); put('me',nDrain,0);
    const du=S.me.board[0]; du.sick=false;
    du.insts[0].mh=20; du.insts[0].hp=4;      /* 회복할 여지를 만들어 둔다 */
    S.me.hp=20; const atk=du.a, hp0=du.insts[0].hp;
    await resolveAttacks('me');
    const gain=(S.me.board[0]?S.me.board[0].insts[0].hp:0)-hp0;
    ok('흡혈 = 제 몸이 회복', S.me.hp===20&&gain===Math.round(atk/2),
       `${nDrain} ATK ${atk} → 제 HP ${hp0}→${hp0+gain} (본체는 ${S.me.hp} 그대로)`);

    /* 13-b) 막히면 회복도 없다 — 가호가 흡수하면 입힌 피해가 0.
       ⚠ 공격자는 **비행이 아닌** 흡혈 크리처를 써야 한다. 비행은 지상 수호를 무시하고
          얼굴을 때려 버려서 '막혔다' 를 만들 수 없다(실제로 이걸로 헛짚었다). */
    const nDrainG=find(c=>(c.kw||'').includes('흡혈')&&!c.f)||nDrain;
    reset(); put('me',nDrainG,0); S.me.board[0].sick=false;
    const wallName=find(c=>c.g&&!c.f&&(c.kw||'').includes('가호'));
    if(wallName){ put('ai',wallName,0);
      const g=S.me.board[0]; g.insts[0].mh=20; g.insts[0].hp=4;
      S.me.hp=20; await resolveAttacks('me');
      const still=S.me.board[0]?S.me.board[0].insts[0].hp:0;
      ok('흡혈 = 0 피해면 0 회복', still===4,
         `${nDrainG} 공격을 ${wallName} 가호가 흡수 → 제 HP 4 그대로 (${still})`); }
    else ok('흡혈 = 0 피해면 0 회복', true, '(가호 수호 크리처 없음 — 건너뜀)');

    /* 14) 용어집이 **키워드**를 전부 설명한다 (카드에 찍히는데 설명이 없으면 안 된다)
       ⚠ 키워드는 "연소 3" 처럼 낱말 하나(+숫자) 꼴이다. 그 틀을 벗어난 조각은
          그 카드만의 고유 효과문("소환 시 …", "내가 스펠을 쓸 때마다 …")이라 용어집에 없는 게 맞다.
          예전엔 (소환|소멸) 만 예외로 뒀는데, 다른 꼴의 고유 효과가 생기자 바로 어긋났다. */
    const heads=new Set();
    Object.keys(POOL).forEach(n=>{ const c=POOL[n];
      if(c.k!=='cr')return;
      (c.kw||'').split('·').map(x=>x.trim()).filter(x=>x&&x!=='—')
        .forEach(x=>{ if(/^[가-힣]+( ?\d+)?$/.test(x))heads.add(x.split(/[\s+]/)[0]); }); });
    const missing=[...heads].filter(h=>!GLOSSARY[h]);
    ok('용어집이 전부 설명', missing.length===0,
       missing.length?`설명 없음: ${missing.join(', ')}`:`${[...heads].length}종 전부 등재`);

    return out;
  });

  let bad=0;
  console.log('─'.repeat(78));
  R.forEach(r=>{ if(!r.pass)bad++;
    console.log((r.pass?'✅':'❌')+' '+r.k.padEnd(20)+' '+r.detail); });
  console.log('─'.repeat(78));
  console.log(bad?`❌ ${bad}건 실패`:`✅ ${R.length}건 전부 통과`);
  if(errs.length){ console.log('ERRORS:',errs.slice(0,3)); bad++; }
  
/* ── 부여받은 능력이 **카드 설명란**에 뜨는가 (2026-08) ────────────
   ⚠ 뱃지는 작아서 확대해도 규칙을 못 읽는다. 카드 효과로 붙은 것은 설명란에 금색으로
     찍히고, 잃은 것(환류를 이미 쓴 몸)은 아예 빠져야 한다. */
let KB=0; const kok=(k,v,d)=>{ if(!v)KB++; console.log((v?'\u2705':'\u274c')+' '+String(k).padEnd(24)+' '+d); };
const LK=await p.evaluate(()=>{
  const strip=h=>h.replace(/<b class="gr">/g,'[').replace(/<\/b>/g,']')
    .replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const eff=(nm,u,o)=>{ const d=document.createElement('div');
    d.innerHTML=tcardHTML(nm,Object.assign({size:'md',unit:u},o||{}));
    return strip(d.querySelector('.teff').innerHTML); };
  S.gen=(S.gen||0)+1; S.me.board=[]; S.ai.board=[]; S.me.noecho={};
  placeCreature('me','헬하운드',0);                    /* 바닐라 4/4 */
  const u=S.me.board[0];
  const before=eff('헬하운드',u);
  u.g=true; u.burn=2; u.drain=true; u.echo=true; u.veil=true; u.multi=3; u.rage=true;
  const after=eff('헬하운드',u);
  /* 인쇄된 것과 부여받은 것이 구분되는가 — 헬시온은 폭발·연소 1 이 인쇄돼 있다 */
  placeCreature('me','헬시온',1);
  const h=S.me.board[1]; h.hard=2;
  const mix=eff('헬시온',h);
  /* 환류를 이미 쓴 몸 · 돌아온 장 */
  placeCreature('me','전기 해파리',2);
  const e=S.me.board[2]; const on=eff('전기 해파리',e); e.echo=false; const off=eff('전기 해파리',e);
  S.me.noecho={'전기 해파리':1};
  const hand=eff('전기 해파리',null,{noecho:echoSpent('me','전기 해파리')});
  const hand0=eff('전기 해파리',null,{noecho:false});
  return {before,after,mix,on,off,hand,hand0};
});
kok('바닐라는 빈칸 그대로', LK.before==='', `"${LK.before}"`);
/* 부여받은 것은 전부 [대괄호] = 금색 표시 */
kok('부여받은 능력이 붙는다',
    /연소 2/.test(LK.after)&&/흡혈/.test(LK.after)&&/환류/.test(LK.after)
    &&/면역/.test(LK.after)&&/연격 3/.test(LK.after)&&/광분/.test(LK.after)
    &&/수호/.test(LK.after), LK.after);
kok('부여는 표시가 다르다', (LK.after.match(/\[/g)||[]).length>=5, LK.after);
/* 인쇄된 폭발·연소 1 은 표시 없이, 부여받은 경화 2 만 표시 */
kok('인쇄된 것과 구분된다', /\[경화 2\]/.test(LK.mix)&&!/\[폭발\]/.test(LK.mix), LK.mix);
kok('환류를 쓰면 빠진다', /환류/.test(LK.on)&&!/환류/.test(LK.off), `있음 "${LK.on}" → 소진 "${LK.off}"`);
kok('돌아온 장도 빠진다', /환류/.test(LK.hand0)&&!/환류/.test(LK.hand),
    `원본 "${LK.hand0}" → 돌아온 장 "${LK.hand}"`);

/* ── 원정에는 장수·동명 제한이 없다 ───────────────────────────── */
const RGL=await p.evaluate(()=>{
  RG.el='fire'; RG.deck=[]; RG.lands=['화염의 원천','화염의 원천'];
  const dup=landOffers('fire').includes('화염의 원천');
  for(let i=0;i<60;i++)RG.deck.push('헬하운드');
  RG.lands=['화염의 원천','화염의 원천','지하 감옥'];
  return {dup, 덱:RG.deck.length, 지형:runLands().reduce((s,[,c])=>s+c,0)};
});
kok('원정 — 동명 지형 제한 없음', RGL.dup===true, `이미 둘을 가져도 또 나온다: ${RGL.dup}`);
kok('원정 — 덱 장수 제한 없음', RGL.덱===60&&RGL.지형>17, `덱 ${RGL.덱}장 · 지형 ${RGL.지형}장`);
if(KB)console.log(`\u274c 설명란 ${KB}건 실패`);

await b.close(); process.exit(bad?1:0);
})();
