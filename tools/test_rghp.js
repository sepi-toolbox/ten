/* 원정 HP 는 런 내내 이어진다 — 특히 **전투를 도중에 접고 나가도 깎인 채로 남는가**
 *   node tools/test_rghp.js
 * 예전 구멍: RG.hp 를 전투가 끝날 때(checkEnd)만 갱신해서, 지고 있는 전투를
 * 설정 → '지도로 돌아가기' 로 빠져나오면 다음 전투에 **만피로** 들어갈 수 있었다. */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const P='file://'+path.join(__dirname,'..','prototype','index.html')+'?dev=1';
(async()=>{
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:430,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(P); await p.waitForTimeout(900);
  const w=ms=>p.waitForTimeout(ms);

  /* 전투 노드로 진입해 멀리건까지 넘긴다 (⚠ rgEnter 는 '전투 시작'을 눌러야 층을 확정한다) */
  async function enter(){
    await p.evaluate(()=>{ const f=RG.floor+1;
      const i=RG.map[f].findIndex(n=>n.t!=='event'&&n.t!=='shop');
      rgEnter(f,i<0?0:i); });
    await w(400);
    if(await p.evaluate(()=>!!document.getElementById('rgGo')))await p.click('#rgGo');
    await w(900);
    await p.evaluate(()=>{ const k=document.getElementById('keepBtn'); k&&k.click(); });
    await w(500);
  }
  const st=()=>p.evaluate(()=>({me:S.me.hp, rg:RG.hp, max:RG.maxhp, f:RG.fighting}));

  /* ⚠ 원정은 이제 **튜토리얼 전투**로 시작한다. 이 검사는 튜토리얼이 아니라 지도·보상을
     보는 것이므로, 사람이 '건너뛰기' 를 누르는 것과 **같은 길**로 넘긴다. */
  await p.evaluate(()=>{ SPEED=8; rgStart('fire'); }); await w(400);
  await p.evaluate(()=>{ if(TUT.on)tutEnd(); }); await w(800);
  const s0=await st();
  ok('원정 시작 만피', s0.rg===s0.max, `HP ${s0.rg}/${s0.max}`);

  // 1) 이긴 전투의 피해가 다음 전투로 이어진다
  await enter();
  await p.evaluate(()=>{ S.me.hp=37; S.ai.hp=0; checkEnd(); }); await w(700);
  const s1=await st();
  ok('이긴 뒤 HP 유지', s1.rg===37&&!s1.f, `RG.hp ${s1.rg} · fighting ${s1.f}`);
  await p.evaluate(()=>{ const x=[...document.querySelectorAll('.mbtns button')].pop(); x&&x.click(); });
  await w(700);

  // 2) ★ 전투를 도중에 접고 나가도 깎인 HP 가 남는다
  await enter();
  const s2a=await st();
  ok('다음 전투 이월', s2a.me===37, `전투 진입 HP ${s2a.me}`);
  await p.evaluate(()=>{ S.me.hp=22; render(); }); await w(300);
  const s2b=await st();
  ok('전투 중 실시간 반영', s2b.rg===22, `맞는 즉시 RG.hp ${s2b.rg}`);
  await p.evaluate(()=>document.getElementById('restart').click());   // 원정에서는 '지도로'
  await w(900);
  const s2c=await st();
  ok('도망쳐도 회복 안 됨', s2c.rg===22&&!s2c.f, `지도로 나온 뒤 RG.hp ${s2c.rg}`);
  await enter();
  const s2d=await st();
  ok('재진입도 깎인 채로', s2d.me===22, `재진입 HP ${s2d.me}`);
  await p.evaluate(()=>document.getElementById('restart').click()); await w(900);

  // 3) 이벤트 회복은 그대로 산다 — 지도 렌더가 낡은 S.me.hp 로 도로 깎지 않는다
  await p.evaluate(()=>runEffects([['heal',30]],()=>{})); await w(300);
  await p.evaluate(()=>{ rgMap(); render(); }); await w(400);
  const s3=await st();
  ok('이벤트 회복은 유효', s3.rg===52, `22 + 회복 30 = RG.hp ${s3.rg}`);
  await enter();
  ok('회복분이 전투로 이월', (await st()).me===52, `전투 진입 HP ${(await st()).me}`);

  if(errs.length){ bad++; console.log('   ERR',errs.slice(0,2)); }
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
