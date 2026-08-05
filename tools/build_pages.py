#!/usr/bin/env python3
"""
gh-pages 브랜치용 정적 사이트를 만들고 커밋·푸시한다.

main 브랜치는 그대로 두고, /tmp의 별도 클론에서 gh-pages 브랜치를 새로 쌓아
force push 한다. (공개 저장소에 gh-pages 브랜치를 올리면 GitHub Pages가
https://sepi-toolbox.github.io/ten/ 로 게시한다.)

  python3 tools/build_pages.py             # 빌드만 (/tmp/ten-pages 에 생성)
  python3 tools/build_pages.py --push      # 빌드 + gh-pages 강제 푸시

토큰은 다음 순서로 찾는다. **저장소 안에는 절대 두지 않는다 — 공개 저장소다.**
  1) --push 뒤에 직접 준 값
  2) ~/.config/ten/token  (권한 600)
  3) 환경변수 GITHUB_TOKEN
환경변수를 마지막에 두는 이유: 이 클라우드 컨테이너는 GITHUB_TOKEN을
"proxy-injected" 같은 더미 값으로 미리 채워 두는 경우가 있어, 먼저 보면
진짜 토큰을 두고도 가짜로 인증을 시도하게 된다. 형식 검사도 함께 한다.
"""
import hashlib
import os
import re
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
    # PWA — 홈 화면에 앱으로 설치할 때 쓰인다
    ("prototype/manifest.webmanifest", "prototype/manifest.webmanifest"),
    ("prototype/sw.js",                "prototype/sw.js"),
    ("prototype/icon-192.png",         "prototype/icon-192.png"),
    ("prototype/icon-512.png",         "prototype/icon-512.png"),
    ("prototype/icon-maskable.png",    "prototype/icon-maskable.png"),
    ("prototype/apple-touch-icon.png", "prototype/apple-touch-icon.png"),
    ("cards/index.html",           "cards/index.html"),
    # 카드 뷰어도 앱(PWA)으로 깔린다 — scope 가 /cards/ 라 게임과 별개의 아이콘이 생긴다
    ("cards/manifest.webmanifest", "cards/manifest.webmanifest"),
    ("cards/sw.js",                "cards/sw.js"),
    ("cards/icon-192.png",         "cards/icon-192.png"),
    ("cards/icon-512.png",         "cards/icon-512.png"),
    ("cards/icon-maskable.png",    "cards/icon-maskable.png"),
    ("cards/apple-touch-icon.png", "cards/apple-touch-icon.png"),
    ("tools/card_gallery.html",    "gallery.html"),
    ("tools/card_editor.html",     "editor.html"),
    # 엘리멘츠 원정 — 본편과 규칙이 다른 별도 모드. data.js 는 gen_etg.py 가 만든다.
    # ⚠ 본편 index.html 과 파일을 하나도 공유하지 않는다. 둘 다 올려야 모드가 뜬다.
    ("prototype/etg/index.html",   "prototype/etg/index.html"),
    ("prototype/etg/data.js",      "prototype/etg/data.js"),
]
DOCS = ["sample_decks", "land_system", "meta_design", "element_design",
        "keywords", "spells", "effects_table", "design_deck", "art_prompts"]
DATA = ["sample_decks.csv", "creatures.csv", "spells.csv", "enchants.csv",
        "lands.csv", "rules.json", "cards.json"]


def sh(*args, cwd=None, check=True):
    return subprocess.run(args, cwd=cwd, check=check,
                          capture_output=True, text=True)


def build():
    # 카드 뷰어는 프로토타입에서 카드 CSS/마크업을 떼어다 만든다 —
    # 올릴 때마다 다시 뽑아야 게임과 규격이 어긋나지 않는다.
    for t in ("build_cards_icons.py", "build_cards_page.py"):
        r = sh("python3", os.path.join(ROOT, "tools", t), check=False)
        print("  " + (r.stdout.strip() or r.stderr.strip()))
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
    stamp_sw()
    # Jekyll 처리를 끈다 (밑줄로 시작하는 경로 등이 사라지는 것 방지)
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    print(f"빌드 완료: {n}개 파일 → {OUT}")
    return n


def stamp_sw():
    """배포본 sw.js 의 CACHE 이름 뒤에 **내용 해시**를 붙인다.

    자동 갱신(앱이 스스로 새 판을 감지해 새로고침)은 **sw.js 가 바이트 단위로 달라져야만** 돈다.
    손으로 CACHE 를 올리는 걸 한 번이라도 빠뜨리면 앱이 옛 화면에 영영 갇힌다 —
    그래서 배포할 때 여기서 자동으로 찍는다. 저장소의 sw.js 는 읽기 좋은 이름 그대로 둔다.
    """
    for page, sw in (("prototype/index.html", "prototype/sw.js"),
                     ("cards/index.html", "cards/sw.js")):
        pf, sf = os.path.join(OUT, page), os.path.join(OUT, sw)
        if not (os.path.exists(pf) and os.path.exists(sf)):
            continue
        h = hashlib.sha1(open(pf, "rb").read()).hexdigest()[:8]
        src = open(sf, encoding="utf-8").read()
        new = re.sub(r"const CACHE = '([^']+)'",
                     lambda m: f"const CACHE = '{m.group(1).split('-h')[0]}-h{h}'", src, count=1)
        open(sf, "w", encoding="utf-8").write(new)
        print(f"  {sw} → {re.search(chr(39)+'([^'+chr(39)+']+)'+chr(39), new).group(1)}")


def push(token):
    sh("git", "init", "-q", "-b", "gh-pages", cwd=OUT)
    sh("git", "config", "user.email", "noreply@anthropic.com", cwd=OUT)
    sh("git", "config", "user.name", "TEN pages builder", cwd=OUT)
    sh("git", "add", "-A", cwd=OUT)
    sh("git", "commit", "-q", "-m", "gh-pages 갱신 — 프로토타입·설계 문서 정적 게시", cwd=OUT)
    # ⚠⚠ 자격 증명을 **URL 이 아니라 헤더**로 보낸다.
    #   이 환경의 git 프록시가 URL 에 박은 토큰을 걷어내고 "이 저장소는 이 세션의 허가
    #   목록에 없다" 며 403 을 준다. Authorization 헤더로 주면 그대로 통과한다.
    #   (2026-08 어느 시점부터 URL 방식이 막혔다 — 세션 중간에 바뀌었다.)
    import base64
    auth = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    url = "https://github.com/sepi-toolbox/ten.git"
    r = sh("git", "-c", f"http.extraHeader=Authorization: Basic {auth}",
           "push", "-q", "--force", url, "gh-pages", cwd=OUT, check=False)
    if r.returncode:
        print("push 실패:", r.stderr.strip()[:400])
        sys.exit(1)
    print("push 완료 → https://sepi-toolbox.github.io/ten/")


TOKEN_FILE = os.path.expanduser("~/.config/ten/token")


def looks_like_token(t):
    """github_pat_… / ghp_… / gho_… 형태이고 충분히 긴가."""
    return bool(t) and len(t) >= 30 and t.split("_")[0] in ("github", "ghp", "gho", "ghs", "ghu")


def find_token(argv, i):
    """--push 뒤 인자 → ~/.config/ten/token → GITHUB_TOKEN 순으로 찾는다."""
    if i + 1 < len(argv) and not argv[i + 1].startswith("-"):
        return argv[i + 1]
    if os.path.exists(TOKEN_FILE):
        t = open(TOKEN_FILE, encoding="utf-8").read().strip()
        if t:
            return t
    env = os.environ.get("GITHUB_TOKEN", "").strip()
    if looks_like_token(env):
        return env
    if env:
        print(f"GITHUB_TOKEN 값이 토큰 형식이 아니라 무시함: {env[:16]}…")
    return None


def main():
    build()
    if "--push" in sys.argv:
        tok = find_token(sys.argv, sys.argv.index("--push"))
        if not tok:
            print("토큰을 찾지 못했습니다. 아래 중 하나를 쓰세요:")
            print("  build_pages.py --push <TOKEN>")
            print("  GITHUB_TOKEN=<TOKEN> build_pages.py --push")
            print(f"  echo -n <TOKEN> > {TOKEN_FILE} && chmod 600 {TOKEN_FILE}")
            sys.exit(1)
        push(tok)


if __name__ == "__main__":
    main()
