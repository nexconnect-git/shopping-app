"""Apply prepared public-domain configuration on the EC2 host, preserving secrets."""
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


def main():
    manifest = json.loads(Path(sys.argv[1]).read_text())
    candidate = Path(sys.argv[2]).read_text()
    assert '@SERVER_NAMES@' not in candidate and '@DOMAIN_SUFFIX@' not in candidate
    directory = Path('/opt/nextou')
    env_file = directory / 'app.env'
    nginx_file = directory / 'nginx.conf'
    urls = manifest['urls']
    public_urls = list(dict.fromkeys([*urls.values(), *manifest.get('additionalPublicUrls', [])]))
    updates = {
        'ALLOWED_HOSTS': ','.join([url.removeprefix('https://') for url in public_urls] + ['backend', 'localhost']),
        'CORS_ALLOWED_ORIGINS': ','.join(public_urls),
        'FRONTEND_URL': urls['customer'], 'CUSTOMER_APP_URL': urls['customer'],
        'VENDOR_APP_URL': urls['vendor'], 'ADMIN_PANEL_URL': urls['admin'],
        'HELP_URL': urls['customer'] + '/help', 'FAQ_URL': urls['customer'] + '/help/faq',
        'SUPPORT_URL': urls['customer'] + '/help', 'PUBLIC_BACKEND_URL': urls['customer'],
    }
    original_env = env_file.read_text()
    updated_env = original_env
    for key, value in updates.items():
        line = f"{key}='{value}'"
        pattern = rf'^{re.escape(key)}=.*$'
        if re.search(pattern, updated_env, flags=re.MULTILINE):
            updated_env = re.sub(pattern, lambda match: line, updated_env, flags=re.MULTILINE)
        else:
            updated_env += '\n' + line + '\n'
    original_nginx = nginx_file.read_text()
    backup = directory / 'backups' / datetime.datetime.now(datetime.timezone.utc).strftime('domains-%Y%m%dT%H%M%SZ')
    backup.mkdir(parents=True, mode=0o700)
    os.chmod(backup.parent, 0o700)
    for file in (env_file, nginx_file):
        shutil.copy2(file, backup / file.name)
    compose = ['docker', 'compose', '-f', str(directory / 'compose.json')]
    services = ['backend', 'worker', 'scheduler']
    try:
        # Write in place because the running Nginx container bind-mounts this inode.
        nginx_file.write_text(candidate)
        subprocess.run([*compose, 'exec', '-T', 'frontend', 'nginx', '-t'], check=True)
        env_file.write_text(updated_env)
        subprocess.run([*compose, 'config', '--quiet'], check=True)
        subprocess.run([*compose, 'up', '-d', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '240', *services], check=True)
        subprocess.run([*compose, 'exec', '-T', 'frontend', 'nginx', '-s', 'reload'], check=True)
    except Exception:
        env_file.write_text(original_env)
        nginx_file.write_text(original_nginx)
        subprocess.run([*compose, 'up', '-d', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '240', *services], check=True)
        subprocess.run([*compose, 'exec', '-T', 'frontend', 'nginx', '-s', 'reload'], check=True)
        raise
    print('Custom-domain routing and backend configuration applied; private rollback copies retained.')


if __name__ == '__main__':
    main()
