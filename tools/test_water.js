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
    reset(); put('me','산호방벽');                          /* 수호 크리처 */
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

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,3));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
