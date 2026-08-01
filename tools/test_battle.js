const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:1500}});
const errs=[];p.on('pageerror',e=>errs.push('ERR: '+e.message));
await p.goto('file:///home/claude/ten/prototype/index.html');await p.waitForTimeout(600);
await p.evaluate(()=>{SPEED=12;});
const out=[];
for(const el of ['fire','water','nature','steel','earth','dark','light']){
  await p.evaluate(e=>setDeck(e),el); await p.waitForTimeout(220);
  try{ await p.click('#keepBtn',{timeout:2000}); }catch(e){}   /* 멀리건 화면 넘기기 */
  await p.waitForTimeout(150);
  await p.evaluate(()=>{SPEED=12;});
  const info=await p.evaluate(()=>({deck:S.me.deck.length+S.me.hand.length,
    lands:DECKLIST.filter(([n])=>LANDS[n]).reduce((s,[,k])=>s+k,0),
    kinds:DECKLIST.length}));
  let turns=0,played=0;
  for(let t=0;t<8;t++){
    played+=await p.evaluate(()=>{
      const P=S.me; let n0=0;
      const li=P.hand.findIndex(n=>isLand(n));
      if(li>=0&&!P.landPlayed){playLand('me',P.hand[li]);P.hand.splice(li,1);}
      for(let pass=0;pass<3;pass++)for(let i=0;i<P.hand.length;i++){
        const n=P.hand[i],c=POOL[n];
        if(!c||isLand(n)||!canPay('me',n))continue;
        let done=false;
        if(c.k==='cr'){const s2=firstEmpty('me',true);
          if(s2>=0){pay('me',n);placeCreature('me',n,s2);onSummon('me',n);done=true;}}
        else if(c.k==='en'){const s2=firstEmpty('me',false);
          if(s2>=0){pay('me',n);S.me.board[s2]={name:n,kind:'en',v:c.v,charge:c.ch};done=true;}}
        else if(c.mode==='aoe'){pay('me',n);S.ai.board.forEach(u=>{if(u&&u.kind==='cr')u.insts.forEach(x=>x.hp-=c.v);});cleanup('ai');done=true;}
        else if(INSTANT.includes(c.mode)){resolveInstant('me',n);pay('me',n);done=true;}
        else if(c.mode==='summon'){const s2=firstEmpty('me',true);
          if(s2>=0){resolveSummon('me',n,s2);pay('me',n);done=true;}}
        else if(NEEDS_FOE.includes(c.mode)){
          const j=S.ai.board.findIndex(u=>u&&(c.mode==='shatter'?u.kind==='en':u.kind==='cr'));
          if(j>=0){resolveOnFoe('me',n,j);cleanup('ai');pay('me',n);done=true;}}
        else if(NEEDS_MINE.includes(c.mode)){
          const j=S.me.board.findIndex(u=>u&&u.kind==='cr');
          if(j>=0){resolveOnMine('me',n,j);pay('me',n);done=true;}}
        if(done){P.hand.splice(i,1);n0++;i--;}
      }
      render(); return n0;
    });
    turns++;
    try{await p.waitForFunction(()=>!document.getElementById('end').disabled,{timeout:6000});}
    catch(e){break;}
    await p.click('#end'); await p.waitForTimeout(120);
  }
  const end=await p.evaluate(()=>({my:S.me.hp,ai:S.ai.hp,over:S.over}));
  out.push(`${el.padEnd(7)} 덱${info.deck} 지형${info.lands} 종${info.kinds}  ${turns}턴 · ${played}장 사용 · HP ${end.my}:${end.ai}${end.over?' (종료)':''}`);
}
console.log(out.join('\n'));
console.log('ERRORS:',errs.length?errs.slice(0,4):'none');
await b.close();})();
