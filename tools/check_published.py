#!/usr/bin/env python3
"""게시된 판(gh-pages)이 지금 작업본과 같은지 확인한다.

⚠⚠ **이걸 만든 이유.** GitHub Pages 는 `main` 이 아니라 **`gh-pages` 브랜치**를 게시한다.
   main 에 아무리 커밋·푸시해도 `tools/build_pages.py --push` 를 안 돌리면 사이트는 그대로다.
   실제로 판을 넷(0.24~0.27)이나 올리는 동안 사이트는 0.23.0 에 멈춰 있었고,
   성권이 "지운 카드가 아직 보인다" 며 앱을 다시 깔기까지 했다. 커밋만으로는 배포가 아니다.

  python3 tools/check_published.py
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REPO = "https://github.com/sepi-toolbox/ten.git"
TOKEN = os.path.expanduser("~/.config/ten/token")


def ver_of(text):
    m = re.search(r"const VERSION='([^']+)'", text or "")
    return m.group(1) if m else None


def main():
    local = ver_of(open(os.path.join(ROOT, "prototype", "index.html"), encoding="utf-8").read())
    if not os.path.exists(TOKEN):
        print("⚠ 토큰이 없어 게시본을 확인하지 못했다 (~/.config/ten/token)")
        return 0
    tok = open(TOKEN).read().strip()
    url = REPO.replace("https://", f"https://x-access-token:{tok}@")
    try:
        subprocess.run(["git", "fetch", "-q", url,
                        "gh-pages:refs/remotes/pages/gh-pages", "--force"],
                       cwd=ROOT, check=True, capture_output=True, timeout=120)
        pub = subprocess.run(["git", "show", "pages/gh-pages:prototype/index.html"],
                             cwd=ROOT, check=True, capture_output=True, timeout=120)
        remote = ver_of(pub.stdout.decode("utf-8", "replace"))
    except Exception as e:
        print(f"⚠ gh-pages 를 못 읽었다: {e}")
        return 0

    print(f"  작업본 v{local}  ·  게시본(gh-pages) v{remote}")
    if local == remote:
        print("✅ 게시본이 최신이다")
        return 0
    print("❌ **게시가 안 됐다.** main 에 커밋·푸시하는 것만으로는 사이트가 안 바뀐다.")
    print("   python3 tools/build_pages.py --push")
    return 1


if __name__ == "__main__":
    sys.exit(main())
