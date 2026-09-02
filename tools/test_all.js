#!/usr/bin/env node
/* 검사 전부 돌리기 — **크래시를 통과로 세지 않는다.**
 *
 * ⚠⚠ 이걸 만든 이유. 나는 오랫동안 `node tools/test_x.js | grep -c "❌"` 로 확인했는데,
 *   **크래시한 검사는 ❌ 를 한 줄도 안 찍는다** → 0건 = 통과로 읽힌다.
 *   실제로 test_keywords 가 '대가 → 제물' 개명 이후 계속 죽어 있었는데
 *   여러 판을 올리는 동안 초록으로 보였다. 종료 코드와 ❌ 를 **둘 다** 본다.
 *
 *   node tools/test_all.js            # 전부
 *   node tools/test_all.js fire water # 이름에 걸리는 것만
 */
const fs=require('fs'), path=require('path'), cp=require('child_process');
const HERE=__dirname;
const pick=process.argv.slice(2);
const files=fs.readdirSync(HERE).filter(f=>/^test_.*\.js$/.test(f)&&f!=='test_all.js')
  .filter(f=>!pick.length||pick.some(p=>f.includes(p))).sort();

const SLOW={ 'test_battle.js':900 };      // 초 단위 — 오래 걸리는 것은 넉넉히
let pass=0, fail=[], crash=[];
console.log('='.repeat(72));
console.log(`검사 ${files.length}종`);
console.log('='.repeat(72));
for(const f of files){
  const t0=Date.now();
  let out='', code=0;
  try{
    out=cp.execFileSync('node',[path.join(HERE,f)],
      {encoding:'utf8', timeout:(SLOW[f]||300)*1000, stdio:['ignore','pipe','pipe']});
  }catch(e){
    code=e.status==null?-1:e.status;
    out=(e.stdout||'')+(e.stderr||'');
  }
  const bad=(out.match(/❌/g)||[]).length;
  const sec=((Date.now()-t0)/1000).toFixed(1);
  /* 크래시 = 출력에 ❌ 가 없는데 죽었거나, 스택 트레이스가 찍힌 것 */
  const died=(code!==0&&bad===0)||/^\s*at .*:\d+:\d+$/m.test(out);
  if(died){ crash.push(f); console.log(`💥 ${f.padEnd(22)} ${sec}s  크래시 (종료 ${code})`);
    const tail=out.trim().split('\n').slice(-3).join('\n      ');
    console.log(`      ${tail}`); }
  else if(bad){ fail.push(f); console.log(`❌ ${f.padEnd(22)} ${sec}s  ${bad}건 실패`);
    /* ⚠ ❌ 만 걸러 내면 **페이지 오류로 죽은 실패는 한 줄도 안 보인다** —
       그 경우 검사가 찍는 건 `ERR [...]` 이지 ❌ 가 아니다(test_burnfx 가 실제로 그랬다).
       무엇이 틀렸는지 모른 채 '1건 실패' 만 남아 재현에 한참 걸렸다. 둘 다 보여 준다. */
    out.split('\n').filter(l=>l.includes('❌')||l.includes('⛔')||/^\s*ERR\b/.test(l))
       .slice(0,6).forEach(l=>console.log('      '+l.trim())); }
  else { pass++; console.log(`✅ ${f.padEnd(22)} ${sec}s`); }
}
console.log('='.repeat(72));
console.log(`통과 ${pass} · 실패 ${fail.length} · 크래시 ${crash.length}`);
if(fail.length)console.log('  실패: '+fail.join(', '));
if(crash.length)console.log('  크래시: '+crash.join(', '));
process.exit(fail.length+crash.length?1:0);
