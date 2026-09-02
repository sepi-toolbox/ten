#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""내가 **지어낸 규칙**을 한 장에 모은다. (멱등)

  python3 tools/list_invented.py            → docs/invented.md 를 다시 쓴다
  python3 tools/list_invented.py --check    → 문서가 코드와 어긋나면 종료 코드 1

■ 왜 이게 있나
  성권: "왜 내가 물어봐야 그런 걸 말해 주는 거야? 자의적으로 규칙을 바꾼 건데
  당연히 보고는 해야 하는 거 아냐?"

  맞는 말이다. 특이점의 매 턴 효과를 내가 지어내 놓고, 성권이 물을 때까지 말하지 않았다.
  '다음부터 잘 보고하겠다' 는 약속은 잊힌다. 그래서 **기계가 세게** 만든다.

■ 규칙
  원작(openEtG 소스 · 카드 원문) 어디에도 없어서 내가 채운 자리에는 코드에 이렇게 적는다.

      /* @지어냄: 무엇을 · 왜 그렇게 정했는지 */

  이 스크립트가 그걸 전부 긁어 docs/invented.md 로 만든다. 검사(test_etg)가
  `--check` 를 돌려서, 코드에 새 `@지어냄` 이 생겼는데 문서에 없으면 **빨간불이 뜬다.**
  즉 지어낸 규칙은 문서에 오르지 않고서는 배포될 수 없다.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = [
    os.path.join(ROOT, "prototype", "etg", "etg.template.html"),
    os.path.join(ROOT, "prototype", "index.html"),
    os.path.join(ROOT, "tools", "gen_etg.py"),
]
OUT = os.path.join(ROOT, "docs", "invented.md")
TAG = "@지어냄:"

HEAD = """# 내가 지어낸 규칙

원작(openEtG 소스 · 카드 원문)에 **답이 없어서 내가 채운 자리**만 모은 문서다.
`tools/list_invented.py` 가 코드의 `@지어냄:` 표시를 긁어 자동으로 만든다 — 손으로 고치지 말 것.

원작에 답이 있는데 내가 틀리게 옮긴 것은 여기가 아니라 **버그**다(`docs/etg_import.md` 참조).
여기 있는 것은 전부 **성권이 뒤집어도 되는 결정**이다. 카드 에디터에서 바로 고칠 수 있다.

"""


def collect():
    out = []
    for path in SRC:
        if not os.path.exists(path):
            continue
        rel = os.path.relpath(path, ROOT)
        txt = open(path, encoding="utf-8").read()
        # 표시는 늘 블록 주석 안에 둔다 — `*/` 까지가 한 건이다
        for m in re.finditer(re.escape(TAG) + r"(.*?)\*/", txt, re.S):
            body = " ".join(x.strip(" *\t") for x in m.group(1).strip().split("\n"))
            line = txt[: m.start()].count("\n") + 1
            out.append((rel, line, re.sub(r"\s+", " ", body).strip()))
    return out


def render(items):
    if not items:
        return HEAD + "지금은 **하나도 없다.** 규칙은 전부 원작 자료에서 나온다.\n"
    s = HEAD + f"지금 **{len(items)}건**.\n\n"
    for rel, line, body in items:
        s += f"- **{body}**\n  <br><sub>{rel}:{line}</sub>\n"
    return s


def main():
    items = collect()
    text = render(items)
    if "--check" in sys.argv:
        cur = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
        if cur.strip() != text.strip():
            print("❌ docs/invented.md 가 코드와 어긋난다 — python3 tools/list_invented.py 를 돌릴 것")
            sys.exit(1)
        print(f"✅ 지어낸 규칙 {len(items)}건 · 문서와 일치")
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"docs/invented.md 생성: 지어낸 규칙 {len(items)}건")


if __name__ == "__main__":
    main()
