#!/usr/bin/env python3
"""
gh-pages 브랜치용 정적 사이트를 만들고 커밋·푸시한다.

main 브랜치는 그대로 두고, /tmp의 별도 클론에서 gh-pages 브랜치를 새로 쌓아
force push 한다. (공개 저장소에 gh-pages 브랜치를 올리면 GitHub Pages가
https://sepi-toolbox.github.io/ten/ 로 게시한다.)

  python3 tools/build_pages.py             # 빌드만 (/tmp/ten-pages 에 생성)
  python3 tools/build_pages.py --push TOKEN  # 빌드 + gh-pages 강제 푸시
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = "/tmp/ten-pages"

# (원본, 사이트상 경로)
FILES = [
    ("site_index.html",            "index.html"),
    ("prototype/index.html",       "prototype/index.html"),
    ("tools/card_gallery.html",    "gallery.html"),
    ("tools/card_editor.html",     "editor.html"),
]
DOCS = ["sample_decks", "land_system", "meta_design", "element_design",
        "keywords", "spells", "effects_table", "design_deck"]
DATA = ["sample_decks.csv", "creatures.csv", "spells.csv", "enchants.csv",
        "lands.csv", "rules.json", "cards.json"]


def sh(*args, cwd=None, check=True):
    return subprocess.run(args, cwd=cwd, check=check,
                          capture_output=True, text=True)


def build():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    n = 0
    for src, dst in FILES:
        s = os.path.join(ROOT, src)
        if not os.path.exists(s):
            print(f"  ! 없음: {src}")
            continue
        d = os.path.join(OUT, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        shutil.copy2(s, d)
        n += 1
    os.makedirs(os.path.join(OUT, "docs"), exist_ok=True)
    for name in DOCS:
        s = os.path.join(ROOT, "docs", name + ".html")
        if os.path.exists(s):
            shutil.copy2(s, os.path.join(OUT, "docs", name + ".html"))
            n += 1
    os.makedirs(os.path.join(OUT, "data"), exist_ok=True)
    for name in DATA:
        s = os.path.join(ROOT, "data", name)
        if os.path.exists(s):
            shutil.copy2(s, os.path.join(OUT, "data", name))
            n += 1
    # Jekyll 처리를 끈다 (밑줄로 시작하는 경로 등이 사라지는 것 방지)
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    print(f"빌드 완료: {n}개 파일 → {OUT}")
    return n


def push(token):
    sh("git", "init", "-q", "-b", "gh-pages", cwd=OUT)
    sh("git", "config", "user.email", "noreply@anthropic.com", cwd=OUT)
    sh("git", "config", "user.name", "TEN pages builder", cwd=OUT)
    sh("git", "add", "-A", cwd=OUT)
    sh("git", "commit", "-q", "-m", "gh-pages 갱신 — 프로토타입·설계 문서 정적 게시", cwd=OUT)
    url = f"https://x-access-token:{token}@github.com/sepi-toolbox/ten.git"
    r = sh("git", "push", "-q", "--force", url, "gh-pages", cwd=OUT, check=False)
    if r.returncode:
        print("push 실패:", r.stderr.strip()[:400])
        sys.exit(1)
    print("push 완료 → https://sepi-toolbox.github.io/ten/")


def main():
    build()
    if "--push" in sys.argv:
        i = sys.argv.index("--push")
        if i + 1 >= len(sys.argv):
            print("사용법: build_pages.py --push <GITHUB_TOKEN>")
            sys.exit(1)
        push(sys.argv[i + 1])


if __name__ == "__main__":
    main()
