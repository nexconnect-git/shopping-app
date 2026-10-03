"""Deploy tested images on the existing host, keeping its configuration and volumes."""

import argparse
import datetime
import fcntl
import hashlib
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path


ROOT = Path("/opt/nextou")
APPLICATIONS = ("backend", "worker", "scheduler", "recommendation", "recommendation-trainer", "frontend")
COMPOSE = ["docker", "compose", "--project-directory", str(ROOT), "-f", str(ROOT / "compose.json")]
PUBLIC_HOSTS = ("nex-connect.in", "customer.nex-connect.in", "vendor.nex-connect.in", "delivery.nex-connect.in", "admin.nex-connect.in")


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def checksum_file(path):
    checksum = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(chunk)
    return checksum.hexdigest()


def candidate_config(original, images):
    candidate = json.loads(json.dumps(original))
    if candidate.get("name") != "nextou-prod":
        raise ValueError("Unexpected Compose project; refusing to change volumes")
    for service in APPLICATIONS:
        app = "backend" if service in ("backend", "worker", "scheduler") else "recommendation" if service.startswith("recommendation") else "frontend"
        candidate["services"][service]["image"] = images[app]["tag"]
    return candidate


def verify_services():
    for host in PUBLIC_HOSTS:
        for route in ("/", "/health/ready/"):
            # Validate the certificate and routing locally, without depending on DNS.
            run(["curl", "--fail", "--silent", "--show-error", "--max-time", "20", "--resolve", f"{host}:443:127.0.0.1", f"https://{host}{route}"], stdout=subprocess.DEVNULL)
    run([*COMPOSE, "exec", "-T", "frontend", "nginx", "-t"])
    # Compose --wait treats processes without healthchecks as ready on startup.
    # Also require that every long-running process survives a settling period.
    time.sleep(10)
    containers = subprocess.check_output([*COMPOSE, "ps", "--all", "--quiet"], text=True).split()
    states = json.loads(subprocess.check_output(["docker", "inspect", *containers], text=True))
    if len(states) != 8:
        raise RuntimeError("Expected all eight production services")
    for container in states:
        state = container["State"]
        if not state["Running"] or state.get("Health", {}).get("Status", "healthy") != "healthy":
            raise RuntimeError(f"Service is not ready: {container['Name']}")


def deploy(release):
    manifest = json.loads((release / "release.json").read_text())
    release_id = manifest["release_id"]
    if not re.fullmatch(r"[0-9a-f]{40}-[0-9]+-[0-9]+", release_id) or release.name != release_id:
        raise ValueError("Invalid release identifier")
    for app in ("backend", "frontend", "recommendation"):
        image = manifest["images"][app]
        if image["tag"] != f"nextou-{app}:{release_id}":
            raise ValueError("Unexpected image tag")
        if checksum_file(release / f"{app}.tar.gz") != image["sha256"]:
            raise ValueError(f"Image checksum failed: {app}")
    compose_file = ROOT / "compose.json"
    original = compose_file.read_text()
    candidate = candidate_config(json.loads(original), manifest["images"])
    if shutil.disk_usage(ROOT).free < 5 * 1024**3:
        raise RuntimeError("At least 5 GiB free disk space is required before deployment")
    backup = ROOT / "backups" / ("release-" + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + release_id)
    backup.mkdir(parents=True, mode=0o700)
    os.chmod(backup.parent, 0o700)
    (backup / "compose.json").write_text(original)
    os.chmod(backup / "compose.json", 0o600)
    for app in ("backend", "frontend", "recommendation"):
        run(["docker", "load", "--input", str(release / f"{app}.tar.gz")], stdout=subprocess.DEVNULL)
        run(["docker", "image", "inspect", manifest["images"][app]["tag"]], stdout=subprocess.DEVNULL)
    # Stop application writers to make the pre-migration snapshot consistent.
    try:
        run([*COMPOSE, "stop", "--timeout", "60", *APPLICATIONS])
        with (backup / "database.dump").open("wb") as stream:
            os.chmod(backup / "database.dump", 0o600)
            run([*COMPOSE, "exec", "-T", "db", "sh", "-ec", 'pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"'], stdout=stream)
        compose_file.write_text(json.dumps(candidate, indent=2) + "\n")
        run([*COMPOSE, "config", "--quiet"])
        # Run migrations once before restarting workers and API processes.
        run([*COMPOSE, "run", "--rm", "--no-deps", "backend", "python", "manage.py", "migrate", "--noinput"])
        run([*COMPOSE, "run", "--rm", "--no-deps", "backend", "python", "manage.py", "collectstatic", "--noinput"], stdout=subprocess.DEVNULL)
        run([*COMPOSE, "up", "-d", "--no-deps", "--force-recreate", "--wait", "--wait-timeout", "300", *APPLICATIONS])
        verify_services()
    except Exception:
        compose_file.write_text(original)
        run([*COMPOSE, "up", "-d", "--no-deps", "--force-recreate", "--wait", "--wait-timeout", "300", *APPLICATIONS])
        print(f"Previous application images restored. Database backup: {backup / 'database.dump'}", flush=True)
        print("Applied database migrations are retained; incompatible schema changes require operator recovery.", flush=True)
        raise
    (ROOT / "current-release.json").write_text(json.dumps(manifest, indent=2) + "\n")
    # Keep the current and previous Docker images, but remove redundant transfer files.
    for archive in ("release.tar.gz", "backend.tar.gz", "frontend.tar.gz", "recommendation.tar.gz"):
        (release / archive).unlink(missing_ok=True)
    retained = {service.get("image") for service in json.loads(original)["services"].values()}
    retained.update(image["tag"] for image in manifest["images"].values())
    tags = subprocess.check_output(["docker", "image", "ls", "--format", "{{.Repository}}:{{.Tag}}"], text=True).splitlines()
    for tag in tags:
        if re.fullmatch(r"nextou-(backend|frontend|recommendation):[0-9a-f]{40}-[0-9]+-[0-9]+", tag) and tag not in retained:
            subprocess.run(["docker", "image", "rm", tag], check=False, stdout=subprocess.DEVNULL)
    print(f"Deployment verified: {release_id}. Pre-migration backup: {backup}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("release", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    with (ROOT / "deployment.lock").open("w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        deploy(args.release.resolve())


if __name__ == "__main__":
    main()
