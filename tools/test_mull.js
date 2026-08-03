/* 멀리건(하스스톤식 · 단 한 번 · 손해 없음)과 뽑기 보정 검사
 *   node tools/test_mull.js */
const path=require('path');
const {chromium}=require('/opt/node-tools/node_modules/playwright');
const FILE='file://'+path.join(__dirname,'..','prototype','index.html');
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1020,height:1300}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(FILE+'?dev=1'); await p.waitForTimeout(700);
  let bad=0; const ok=(k,v,d)=>{ if(!v)bad++; console.log((v?'✅':'❌')+' '+k.padEnd(22)+' '+d); };

  // 1) 시작 화면 = 멀리건 창. 버튼은 확인 하나뿐이고 '멀리건 N회' 버튼은 없다.
  const ui=await p.evaluate(()=>({
    열림:document.getElementById('mull').classList.contains('on'),
    버튼:[...document.querySelectorAll('#mull .mbtns button')].map(x=>x.id),
    손패:document.querySelectorAll('#mull .mcard').length,
    문구:document.querySelector('#mull .msub').textContent.replace(/\s+/g,' ').trim()}));
  ok('멀리건 창', ui.열림&&ui.손패===7, `카드 ${ui.손패}장`);
  ok('버튼은 확인 하나', ui.버튼.length===1&&ui.버튼[0]==='keepBtn', JSON.stringify(ui.버튼));
  ok('한 번뿐 · 손해 없음 안내', /한 번/.test(ui.문구)&&/손해는 없/.test(ui.문구), '"'+ui.문구.slice(0,34)+'…"');

  // 2) 뽑기 보정 — 첫 손패에 지형이 반드시 1장 이상. 200회 돌려 본다.
  const fx=await p.evaluate(()=>{
    let min=99, zero=0, sum=0, n=200;
    for(let t=0;t<n;t++){
      S.me.deck=buildDeck(PDECK); S.me.hand=[];
      dealHand('me');
      const L=S.me.hand.filter(isLand).length;
      if(L<min)min=L; if(L===0)zero++; sum+=L;
      if(S.me.hand.length!==7)return {err:'손패 '+S.me.hand.length};
      /* 보정으로 카드가 복제되거나 사라지면 안 된다 */
      if(S.me.hand.length+S.me.deck.length!==40)return {err:'총장수 '+(S.me.hand.length+S.me.deck.length)};
    }
    return {min,zero,avg:+(sum/n).toFixed(2)};
  });
  ok('지형 보정', !fx.err&&fx.zero===0&&fx.min>=1, fx.err||`200판 최소 ${fx.min}장 · 0장 ${fx.zero}회 · 평균 ${fx.avg}장`);

  // 3) 카드를 골랐다 풀 수 있고, 고른 만큼만 표시된다
  await p.evaluate(()=>{ S.me.deck=buildDeck(PDECK); S.me.hand=[]; dealHand('me');
    S.mull={back:[],done:false}; showMull(); });
  await p.click('#mull .mcard[data-m="0"]'); await p.click('#mull .mcard[data-m="2"]');
  await p.click('#mull .mcard[data-m="4"]'); await p.waitForTimeout(120);
  let sel=await p.evaluate(()=>[...S.mull.back].sort((a,b)=>a-b));
  await p.click('#mull .mcard[data-m="2"]'); await p.waitForTimeout(120);
  const sel2=await p.evaluate(()=>[...S.mull.back].sort((a,b)=>a-b));
  const btn=await p.$eval('#keepBtn',e=>e.textContent.trim());
  ok('고르기 · 다시 눌러 해제', JSON.stringify(sel)==='[0,2,4]'&&JSON.stringify(sel2)==='[0,4]',
     `${JSON.stringify(sel)} → ${JSON.stringify(sel2)}`);
  ok('확인 버튼 문구', /2장 다시 뽑기/.test(btn), `"${btn}"`);

  // 4) redrawPicked 자체 — 장수 손해가 없고, 되돌린 카드가 그 자리에서 다시 오지 않는다
  const rd=await p.evaluate(()=>{
    S.me.deck=buildDeck(PDECK); S.me.hand=[]; dealHand('me');
    const h0=S.me.hand.slice(), d0=S.me.deck.length;
    const gone=[h0[0],h0[4]], keep=h0.filter((_,i)=>i!==0&&i!==4);
    redrawPicked('me',[0,4]);
    const fresh=S.me.hand.slice(keep.length);
    return {장수:S.me.hand.length, 덱:[d0,S.me.deck.length], 총합:S.me.hand.length+S.me.deck.length,
      남김:keep.every(n=>S.me.hand.includes(n)), gone, fresh};
  });
  ok('장수 손해 없음', rd.장수===7&&rd.덱[0]===rd.덱[1]&&rd.총합===40,
     `손패 ${rd.장수} · 덱 ${rd.덱[0]} → ${rd.덱[1]} · 합계 ${rd.총합}`);
  ok('남긴 카드는 그대로', rd.남김, rd.fresh.length+'장만 교체됨');
  /* 되돌린 카드가 그 자리에서 다시 뽑히면 안 된다.
     ⚠ 기본 지형은 덱에 17장이라 같은 **이름**이 다시 오는 건 정상이다 —
        덱 전체에 딱 1장뿐인 카드를 골라야 이 성질을 진짜로 잴 수 있다. */
  const uniq=await p.evaluate(()=>{
    let hit=0, back=0;
    for(let t=0;t<60;t++){
      S.me.deck=buildDeck(PDECK); S.me.hand=[]; dealHand('me');
      const all=S.me.hand.concat(S.me.deck);
      const cnt={}; all.forEach(n=>cnt[n]=(cnt[n]||0)+1);
      const i=S.me.hand.findIndex(n=>cnt[n]===1);
      if(i<0)continue;
      hit++;
      const gone=S.me.hand[i];
      redrawPicked('me',[i]);
      if(S.me.hand.includes(gone))back++;
    }
    return {hit,back};
  });
  ok('되돌린 카드 즉시 재등장 안 함', uniq.hit>0&&uniq.back===0,
     `1장뿐인 카드 ${uniq.hit}회 되돌림 · 재등장 ${uniq.back}회`);

  // 5) 확인 버튼 → 창이 닫히고 1턴이 시작된다(1턴 드로우 때문에 손패는 8장이 된다)
  await p.evaluate(()=>{ S.me.deck=buildDeck(PDECK); S.me.hand=[]; dealHand('me');
    S.mull={back:[0,4],done:false}; showMull(); });
  const bf=await p.evaluate(()=>S.me.deck.length);
  await p.click('#keepBtn'); await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({hand:S.me.hand.length,deck:S.me.deck.length,
    닫힘:!document.getElementById('mull').classList.contains('on'),턴:S.turn}));
  ok('창이 닫히고 게임 시작', after.닫힘&&after.hand===8&&after.deck===bf-1,
     `손패 8(1턴 드로우 포함) · 덱 ${bf} → ${after.deck}`);

  // 6) 두 번째 기회는 없다
  const twice=await p.evaluate(()=>{
    const h0=S.me.hand.slice();
    S.mull.back=[0,1]; const kb=document.getElementById('keepBtn'); if(kb)kb.click();
    return JSON.stringify(h0)===JSON.stringify(S.me.hand);});
  ok('기회는 한 번뿐', twice, 'done 플래그로 재실행 차단');

  if(errs.length){bad++;console.log('   ERR',errs.slice(0,2));}
  console.log(bad?`❌ ${bad}건 실패`:'✅ 전부 통과');
  await b.close(); process.exit(bad?1:0);
})();
