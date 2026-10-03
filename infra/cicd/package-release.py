"""Create the public release manifest; never read production credentials."""

import hashlib
import json
import re
import sys
from pathlib import Path


def main():
    directory = Path(sys.argv[1])
    release_id = sys.argv[2]
    if not re.fullmatch(r"[0-9a-f]{40}-[0-9]+-[0-9]+", release_id):
        raise ValueError("Invalid release identifier")
    images = {}
    for app in ("backend", "frontend", "recommendation"):
        archive = directory / f"{app}.tar.gz"
        with archive.open("rb") as stream:
            checksum = hashlib.file_digest(stream, "sha256").hexdigest()
        images[app] = {"tag": f"nextou-{app}:{release_id}", "sha256": checksum}
    manifest = {"release_id": release_id, "revision": release_id.split("-")[0], "images": images}
    (directory / "release.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
