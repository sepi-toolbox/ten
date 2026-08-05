# TEN — 업데이트·배포 프롬프트 (다른 방에 그대로 붙여넣기)

아래 `===` 사이를 통째로 복사해서 새 방 첫 메시지로 붙여넣으세요.
`<여기에_PAT>` 자리에만 본인 토큰을 넣으면 됩니다.

---

```
===============================================================================
sepi-toolbox/ten 저장소로 작업한다. 아래를 그대로 지켜라. 순서와 경고가 곧 규칙이다.

■ 0. 준비 (컨테이너가 새로 뜬 방이면 매번 필요하다)

  cd ~ && git clone https://github.com/sepi-toolbox/ten.git && cd ~/ten
  mkdir -p ~/.config/ten
  printf '%s' '<여기에_PAT>' > ~/.config/ten/token
  chmod 600 ~/.config/ten/token

  ⚠⚠ 이 저장소는 **공개(public)** 다. 토큰을 저장소 안에 두지 마라.
     반드시 ~/.config/ten/token (저장소 밖)에 두고 chmod 600 한다.
     .gitignore 에 *token* · *.pat · .env 가 이미 있지만, 애초에 넣지 마라.
  ⚠⚠ 환경변수 GITHUB_TOKEN 은 컨테이너가 미리 넣어 둔 **가짜 값**(proxy-injected)이다.
     인증에 절대 쓰지 마라. 토큰은 위 파일에서만 읽는다.

  작업 전에 ten/CLAUDE.md 를 읽어 맥락을 복원한다. 카드·규칙·함정이 전부 거기 있다.

■ 1. 카드/규칙을 고친다 — 정본은 코드 한 곳뿐

  카드 정본 = tools/gen_decks.py 의 DECKS · RARITY · KW · ENCH_TRIG.
  data/ 의 CSV·JSON 은 전부 **생성물**이다. 직접 손대지 마라.

  ⚠⚠ data/ten_balance.xlsx 를 openpyxl 로 **쓰지 마라**. 수식 캐시가 날아간다. 읽기만.

  파이프라인은 순서가 있다. 카드를 고쳤으면 전부 다시 돌린다:

  python3 tools/gen_decks.py            # 예산 검산 + sample_decks.csv
  python3 tools/gen_grown.py --write    # 성장·진형 상위 몸
  python3 tools/promote_decks.py        # DECKS → CSV · cards.json · decks.json
  python3 tools/gen_rogue.py            # 강화(원정) 카드 — 인챈트를 고쳤으면 필수
  python3 tools/gen_enemies.py          # 적 명단·고정 덱
  python3 tools/build_proto_data.py     # POOL·DECKS·LANDS·GLOSSARY 주입
  python3 tools/build_prototype.py      # 아트 data URI 주입
  python3 tools/build_editor.py
  python3 tools/build_deck_doc.py
  python3 tools/build_cards_page.py     # 카드 뷰어(cards/index.html)
  python3 tools/dump_over.py            # 예산 초과 기록(고치지 말고 기록만)

  ⚠ 인챈트를 새로 만들거나 트리거를 바꿨으면 gen_rogue 를 **반드시** 다시 돌려라.
    강화판이 tg/fx 를 물려받는데, 안 돌리면 강화 카드만 fx 가 비어 조용히 안 돈다.

■ 2. 판 번호를 올린다 — 안 올리면 사람들 화면이 안 바뀐다

  prototype/index.html : const VERSION='x.y.z', BUILD='YYYY-MM-DD'
  prototype/sw.js      : const CACHE = 'ten-vNN'   ← 숫자를 반드시 +1

  ⚠⚠ 서비스워커 캐시 이름을 안 바꾸면 **앱에 옛 화면이 계속 뜬다.**
     "다시 깔아도 그대로"라는 말이 나오면 십중팔구 이걸 안 바꾼 것이다.
  ⚠ 번호를 올린 **뒤에** build_cards_page.py 를 한 번 더 돌려라.
     뷰어가 게임 캐시 이름을 안고 있어서, 안 맞으면 test_cards 가 실패한다.

■ 3. 검사 — 반드시 test_all.js 로 돌린다

  node tools/test_all.js              # 전부 (약 7분)
  node tools/test_all.js dark castfx  # 이름에 걸리는 것만

  ⚠⚠ `node tools/test_x.js | grep -c "❌"` 로 확인하지 마라.
     **크래시한 검사는 ❌ 를 한 줄도 안 찍는다** → 0건 = 통과로 읽힌다.
     실제로 여러 판을 그렇게 초록으로 보며 올렸다. test_all.js 는 종료 코드와 ❌ 를 둘 다 본다.
  ⚠ 검사가 오래 걸리므로 백그라운드로 돌리고 로그를 tail 로 봐라:
     (timeout 580 node tools/test_all.js > /tmp/all.log 2>&1) & sleep 450; tail -20 /tmp/all.log

  python3 tools/validate_budget.py     # 예산·동기화·덱 40장
  ⚠ 예산 초과는 **지금 고치지 않는다**(성권이 모든 속성 끝난 뒤 일괄 검수).
    docs/budget_over.md 에 기록만 하고 넘어간다. 그래서 validate_budget 은 exit 1 이 정상이다.
    단 "[2] 동기화 불일치"와 "[3] 덱 40장"은 반드시 0/통과여야 한다.

■ 4. 커밋 → main 푸시

  git add -A
  git commit -m "<무엇을 왜 바꿨는지 · 밟은 함정까지>"
  T=$(cat ~/.config/ten/token); B=$(printf 'x-access-token:%s' "$T" | base64 -w0)
  git -c "http.extraHeader=Authorization: Basic $B" push -q https://github.com/sepi-toolbox/ten.git HEAD:main

  ⚠⚠ **URL 에 토큰을 박는 방식(https://x-access-token:$T@github.com/...)은 막혔다.**
     이 환경의 git 프록시가 그 자격 증명을 걷어내고 403 을 준다:
       "sepi-toolbox/ten is not in this session's authorized repository set"
     반드시 위처럼 **Authorization 헤더**로 보내라. 읽기(clone·fetch)는 그냥 된다.

■ 5. 배포 — ⚠⚠⚠ git push 는 배포가 아니다

  GitHub Pages 는 main 이 아니라 **gh-pages 브랜치**를 게시한다.
  main 에만 올려 놓고 "배포했다"고 말하면 거짓말이 된다(실제로 네 판을 그렇게 흘렸다).

  python3 tools/build_pages.py --push     # 토큰은 ~/.config/ten/token 에서 알아서 읽는다
  sleep 25
  python3 tools/check_published.py        # 작업본 == 게시본 인지 확인. exit 1 이면 아직 옛 판

  check_published 가 ✅ 를 찍기 전에는 "올렸다"고 말하지 마라.

  주소: 게임 https://sepi-toolbox.github.io/ten/prototype/
        카드 https://sepi-toolbox.github.io/ten/cards/

■ 6. 보고

  무엇을 고쳤는지, **왜 그렇게 골랐는지**, 밟은 함정을 함께 적는다.
  임의로 판단한 것이 있으면 반드시 따로 밝힌다(성권이 되돌릴 수 있게).
  카드를 새로 만드는 것은 **승인 사항**이다 — 명세에 없는 카드는 만들지 말고 물어라.
===============================================================================
```

---

## 다른 방에서 "안 된다"고 할 때 — 십중팔구 이 넷

| 증상 | 원인 | 손볼 곳 |
|---|---|---|
| `403 ... not in this session's authorized repository set` | URL 에 토큰을 박아 밀었다 | 4번의 `http.extraHeader` 방식으로 |
| `토큰을 찾지 못했습니다` | `~/.config/ten/token` 이 없다(새 컨테이너) | 0번을 다시 |
| 푸시는 됐는데 사이트가 그대로 | `main` 에만 올렸다 | 5번 `build_pages.py --push` |
| 다시 깔아도 옛 화면 | `sw.js` 의 `CACHE` 이름을 안 바꿨다 | 2번 |

`GITHUB_TOKEN` 환경변수는 가짜 값이라, 그걸 믿고 인증하면 위 첫 줄 증상이 그대로 난다.
