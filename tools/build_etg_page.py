#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""엘리멘츠 대전 페이지를 만든다. (멱등)

  python3 tools/build_etg_page.py     →  prototype/etg/index.html

핵심 원칙 — **카드 규격은 본편이 그리는 것을 그대로 쓴다.**
카드 CSS 를 이 모드용으로 다시 쓰지 않는다. 규격이 두 벌이 되면 반드시 어긋난다
(옛 tools/card_gallery.html 이 실제로 그렇게 낡아 버렸고, 카드 뷰어를 만들 때
build_cards_page.py 로 같은 원칙을 세웠다).

그래서 prototype/index.html 의 `<style>` 전부를 잘라다 붙인다:
  .tcard / .thead / .tart / .teff / .tstat / .tb        — 카드 한 장
  .board / .slot / .hand / .hcw                          — 판과 손패
  .zoom / .zwrap / .zside / .zdef / .zhint               — 길게 눌러 보는 확대창

본편 마크업이 바뀌면 이 스크립트만 다시 돌리면 이 모드도 따라온다.

⚠ 가져오는 것은 **CSS 뿐이다.** POOL·FRAMES·ART 같은 본편 **데이터는 한 줄도 안 가져온다** —
  이 모드에는 본편 카드가 없어야 하기 때문이다(test_etg 의 첫 항목이 그걸 센다).
  그래서 프레임 카드(.tcard.fr)는 안 쓰고, 본편이 프레임이 없을 때 쓰는
  **CSS 카드(.tcard.normal)** 쪽 규격만 쓴다. 속성 색은 --el 하나로 갈린다.
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROTO = os.path.join(ROOT, "prototype", "index.html")
TPL = os.path.join(ROOT, "prototype", "etg", "etg.template.html")
OUT = os.path.join(ROOT, "prototype", "etg", "index.html")
ETPL = os.path.join(ROOT, "prototype", "etg", "edit.template.html")
EOUT = os.path.join(ROOT, "prototype", "etg", "edit.html")
ENGINE = os.path.join(ROOT, "prototype", "etg", "engine.js")
MARK = "<!--TENCSS-->"


def head_style(src):
    """⚠ 본편에는 `<noscript><style>…</style></noscript>` 가 **먼저** 나온다.
    첫 <style> 만 집으면 그 한 줄짜리 예비 스타일만 와서 카드가 통째로 민무늬가 된다
    (뷰어를 만들 때 실제로 그렇게 만들었다가 잡았다). 전부 이어 붙인다."""
    blocks = re.findall(r"<style>(.*?)</style>", src, re.S)
    if not blocks:
        raise SystemExit("<style> 을 찾지 못했다 — 본편 구조가 바뀌었나?")
    return "\n".join(blocks)


def engine_js(page):
    """게임 페이지의 인라인 <script> 를 그대로 떼어 engine.js 로 낸다.

    ⚠⚠ **카드 에디터가 이 파일을 그대로 쓴다.** 규격(.tcard)과 설명 짓는 규칙
    (ruleText·fillN·abilName)이 두 벌이 되면, 에디터 미리보기와 실제 카드가
    어긋나 에디터를 믿을 수 없게 된다. 그래서 베끼지 않고 **같은 파일**을 쓴다.
    (CSS 를 본편에서 통째로 가져오는 것과 같은 이유다.)

    엔진은 `window.ETG_NOBOOT` 이 켜져 있으면 판을 열지 않는다 — 에디터가 그걸 쓴다.
    """
    blocks = re.findall(r"<script>\s*\n'use strict';(.*?)</script>", page, re.S)
    if len(blocks) != 1:
        raise SystemExit(f"엔진 <script> 를 하나만 찾아야 하는데 {len(blocks)}개다")
    return "'use strict';\n" + blocks[0]


def main():
    proto = open(PROTO, encoding="utf-8").read()
    tpl = open(TPL, encoding="utf-8").read()
    if MARK not in tpl:
        raise SystemExit(f"틀에 {MARK} 자리가 없다")
    css = head_style(proto)
    # 본편의 --cardw 는 폰 한 줄에 10칸을 맞춘 값이다. 이 모드는 판이 더 넓으므로
    # 아래 etg 전용 style 에서 다시 잡는다(틀 쪽에 있다).
    out = tpl.replace(MARK, "<style>\n/* ↓↓ 본편 prototype/index.html 에서 그대로 가져온 규격 "
                            "— 손대지 말고 tools/build_etg_page.py 를 다시 돌릴 것 ↓↓ */\n"
                            + css + "\n</style>")
    ver = re.search(r"const VERSION='([\d.]+)'", tpl)
    v = ver.group(1) if ver else "?"
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"엘리멘츠 대전 페이지 생성: prototype/etg/index.html "
          f"({len(out)//1024} KB · 본편 CSS {len(css)//1024} KB · v{v})")

    # ── 엔진(에디터와 공유) ───────────────────────────────────────────────
    eng = engine_js(out)
    with open(ENGINE, "w", encoding="utf-8") as f:
        f.write("/* ⚠⚠ 생성물이다 — prototype/etg/etg.template.html 을 고치고\n"
                "   python3 tools/build_etg_page.py 를 다시 돌릴 것.\n"
                "   게임(index.html)과 카드 에디터(edit.html)가 **이 한 벌**을 같이 쓴다. */\n"
                + eng)
    print(f"엘리멘츠 엔진 생성: prototype/etg/engine.js ({len(eng)//1024} KB)")

    # ── 카드 에디터 ──────────────────────────────────────────────────────
    etpl = open(ETPL, encoding="utf-8").read()
    if MARK not in etpl:
        raise SystemExit(f"에디터 틀에 {MARK} 자리가 없다")
    # ⚠⚠ 에디터에는 본편 CSS 만으로 부족하다. 카드의 **이 모드 규격**(고정 텍스트 박스,
    #    .teff 글자 단계, 발치 줄의 .ttag)은 etg.template.html 의 <style> 에 있다.
    #    그걸 빼먹었더니 미리보기의 발치 줄이 통째로 커져 카드가 딴 규격으로 보였다 —
    #    에디터 미리보기가 실제와 다르면 에디터를 믿을 수 없다.
    etgcss = "\n".join(re.findall(r"<style>(.*?)</style>", tpl, re.S))
    eout = etpl.replace(MARK, "<style>\n/* ↓↓ 본편에서 그대로 가져온 규격 — 손대지 말 것 ↓↓ */\n"
                              + css
                              + "\n/* ↓↓ 엘리멘츠 모드 규격(etg.template.html) — 같은 자리에서 온다 ↓↓ */\n"
                              + etgcss + "\n</style>")
    with open(EOUT, "w", encoding="utf-8") as f:
        f.write(eout)
    print(f"카드 에디터 생성: prototype/etg/edit.html ({len(eout)//1024} KB)")

    # ── 지어낸 규칙 문서도 같이 ────────────────────────────────────────────
    # ⚠ docs/invented.md 는 `@지어냄:` 표시의 **줄 번호**까지 적는다. 그래서 이 틀을
    #   한 줄만 고쳐도 문서가 어긋나 검사가 빨간불을 낸다 — 정작 지어낸 규칙은 그대로인데.
    #   손으로 다시 돌리는 걸 자꾸 잊어 빌드가 같이 한다. 내용이 같으면 파일은 안 바뀐다.
    subprocess.run([sys.executable, os.path.join(HERE, "list_invented.py")], check=True)


if __name__ == "__main__":
    main()
