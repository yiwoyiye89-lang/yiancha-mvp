"""
艺安查前端部署脚本（Netlify 文件级部署）

用法：
    python deploy.py                # 部署标准文件集到生产站
    python deploy.py --dry-run      # 仅打印待部署文件，不实际上传

说明：
    - 通过 Netlify REST API 直接上传文件（无需 netlify-cli，适合沙箱/无 CLI 环境）。
    - 部署后会自动成为 production published deploy。
    - Token 建议改为环境变量 NETLIFY_TOKEN（避免明文入库）；此处保留默认值仅因单机使用。
    - 部署文件集含 artists.json（前端离线兜底所需），确保线上离线模式可用。
"""
import os
import sys
import json
import base64
import ssl
import time
import urllib.request
import urllib.error

# ---- Netlify 凭据（建议改为环境变量 NETLIFY_TOKEN）----
TOKEN = os.environ.get("NETLIFY_TOKEN", "nfp_EsgVknJ5EdqyyasHyFG1yvEjoYefy6Sxb4c4")
SITE_ID = "e97eae2d-1f84-4964-ba5f-5bcefd206311"

# ---- 待部署文件集（保持与线上一致，含离线兜底所需的 artists.json）----
DEPLOY_FILES = [
    "index.html",
    "app.js",
    "artists.json",
    "invite.html",
    "design/ui-prototype.html",
    "README.md",
    "netlify.toml",
    "_headers",
]

MAX_RETRY = 3


def read_and_encode(fname):
    with open(fname, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def deploy(dry_run=False):
    missing = [f for f in DEPLOY_FILES if not os.path.exists(f)]
    if missing:
        print(f"[WARN] 以下文件缺失，将跳过: {missing}")
    files = [f for f in DEPLOY_FILES if f not in missing]

    print(f"待部署文件 ({len(files)}):")
    for f in files:
        print(f"  - {f} ({os.path.getsize(f)} bytes)")

    if dry_run:
        print("[dry-run] 未实际上传。")
        return

    deploy_files = {f: read_and_encode(f) for f in files}
    url = f"https://api.netlify.com/api/v1/sites/{SITE_ID}/deploys"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    payload = json.dumps({"files": deploy_files, "functions": {}, "async": False}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    ctx = ssl.create_default_context()

    last_err = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                print("\nDeploy successful!")
                print(f"Deploy ID : {result.get('id', 'N/A')}")
                print(f"Live URL  : https://yiancha.netlify.app")
                print(f"Deploy URL: {result.get('deploy_url', 'N/A')}")
                return
        except (urllib.error.URLError, OSError) as e:
            last_err = e
            print(f"[retry {attempt}/{MAX_RETRY}] Deploy failed: {e}")
            time.sleep(2 * attempt)
    print(f"[ERROR] 部署最终失败: {last_err}")
    sys.exit(1)


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    deploy(dry_run=dry)
