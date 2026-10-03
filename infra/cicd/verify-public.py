"""Check production role routing, bundles and readiness without login credentials."""

import json
import re
import urllib.request


def get(url):
    with urllib.request.urlopen(url, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f"Unexpected status for {url}: {response.status}")
        return response.read(), response.headers


def main():
    bundles = []
    for role in ("customer", "vendor", "delivery", "admin"):
        base = f"https://{role}.nex-connect.in"
        html, headers = get(base + "/")
        if not headers.get("Strict-Transport-Security"):
            raise RuntimeError(f"Missing HSTS for {role}")
        bundle = re.search(r'src="(main-[^"/]+\.js)"', html.decode())
        if not bundle:
            raise RuntimeError(f"Missing Angular bundle for {role}")
        bundles.append(bundle[1])
        _, headers = get(base + "/" + bundle[1])
        if "javascript" not in headers.get("Content-Type", ""):
            raise RuntimeError(f"Invalid bundle for {role}")
        get(base + "/login")
        body, _ = get(base + "/health/ready/")
        health = json.loads(body)
        if health["status"] != "ready" or not all(check["ok"] for check in health["checks"].values()):
            raise RuntimeError(f"Readiness failed for {role}")
        print(f"Verified {role}: HTTPS, bundle, deep link and dependency readiness")
    if len(set(bundles)) != 4:
        raise RuntimeError("Role domains must serve four distinct applications")
    get("https://nex-connect.in/")
    get("https://www.nex-connect.in/")


if __name__ == "__main__":
    main()
