"""Prepare a private deployment bundle from local settings without printing secrets."""
import hashlib
import json
import secrets
import shutil
import subprocess
import tarfile
from pathlib import Path

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output' / 'aws-deployment'
RELEASE = OUTPUT / 'release'
RELEASE.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUTPUT / 'resources.json').read_text(encoding='utf-8-sig'))
urls = manifest['urls']
public_urls = list(dict.fromkeys([*urls.values(), *manifest.get('additionalPublicUrls', [])]))
local = dotenv_values(ROOT / '.env')
smtp_file = OUTPUT / 'gmail-smtp.env'
if smtp_file.exists():
    local.update({key: value for key, value in dotenv_values(smtp_file).items() if value})
    if local.get('SMTP_EMAIL'):
        local['EMAIL_FROM_ADDRESS'] = local['SMTP_EMAIL']
    if local.get('SMTP_APP_PASSWORD'):
        local['SMTP_APP_PASSWORD'] = local['SMTP_APP_PASSWORD'].replace(' ', '')
allowed_prefixes = ('SMTP_', 'EMAIL_', 'RAZORPAY_', 'SUPPORT_', 'BRAND_')
allowed_keys = {'DEFAULT_FROM_EMAIL', 'FROM_NAME', 'FROM_EMAIL', 'GOOGLE_MAPS_API_KEY',
                'GOOGLE_MAPS_MAP_ID', 'WELCOME_COUPON_CODE', 'OTP_EXPIRY_MINUTES',
                'EMAIL_VERIFICATION_EXPIRY_MINUTES', 'FILE_UPLOAD_MAX_SIZE',
                'FILE_UPLOAD_ALLOWED_CONTENT_TYPES'}
app = {key: value for key, value in local.items() if value is not None and
       (key.startswith(allowed_prefixes) or key in allowed_keys)}
credentials_file = OUTPUT / 'credentials.json'
if credentials_file.exists():
    credentials = json.loads(credentials_file.read_text(encoding='utf-8'))
else:
    credentials = {'database_password': secrets.token_hex(32), 'django_secret_key': secrets.token_hex(48),
                   'admin': {'username': 'admin', 'email': 'admin@nex-connect.in',
                             'password': secrets.token_urlsafe(30), 'first_name': 'Nikhil', 'last_name': 'Pradeep'}}
    credentials_file.write_text(json.dumps(credentials, indent=2), encoding='utf-8')
db = {'DB_ENGINE': 'django.db.backends.postgresql', 'DB_NAME': 'nextou', 'DB_USER': 'nextou',
      'DB_PASSWORD': credentials['database_password'], 'DB_HOST': 'db', 'DB_PORT': '5432'}
app.update(db)
app.update({'SECRET_KEY': credentials['django_secret_key'], 'DEBUG': 'False', 'DJANGO_ENV': 'production',
            'ALLOWED_HOSTS': ','.join([url.removeprefix('https://') for url in public_urls] + ['backend', 'localhost']),
            'CORS_ALLOW_ALL_ORIGINS': 'False', 'CORS_ALLOWED_ORIGINS': ','.join(public_urls),
            'REDIS_HOST': 'redis', 'REDIS_PORT': '6379', 'USE_S3': 'False',
            'AUTH_REFRESH_COOKIE_DOMAIN': '', 'AUTH_REFRESH_COOKIE_SECURE': 'True',
            'CUSTOMER_AUTH_EXPOSE_DEV_OTP': 'False', 'ENABLE_DJANGO_RQ_DASHBOARD': 'False',
            'EMAIL_BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
            'FRONTEND_URL': urls['customer'], 'CUSTOMER_APP_URL': urls['customer'],
            'VENDOR_APP_URL': urls['vendor'], 'ADMIN_PANEL_URL': urls['admin'],
            'HELP_URL': urls['customer'] + '/help', 'FAQ_URL': urls['customer'] + '/help/faq',
            'SUPPORT_URL': urls['customer'] + '/help', 'PUBLIC_BACKEND_URL': urls['customer']})

def write_env(name, values):
    # Compose dotenv single quotes prevent substitution of dollar signs in credentials.
    content = '\n'.join(f"{key}='{str(value).replace(chr(39), chr(92) + chr(39))}'" for key, value in values.items()) + '\n'
    (RELEASE / name).write_text(content, encoding='utf-8')

write_env('app.env', app)
write_env('db.env', db)
write_env('.env', {**db, 'GOOGLE_MAPS_API_KEY': app.get('GOOGLE_MAPS_API_KEY', ''),
                  'GOOGLE_MAPS_MAP_ID': app.get('GOOGLE_MAPS_MAP_ID', '')})
config = json.loads(subprocess.check_output(['docker', 'compose', '-f', str(ROOT / 'docker-compose.prod.yml'),
    'config', '--no-env-resolution', '--no-interpolate', '--format', 'json'], cwd=ROOT, text=True))
config['name'] = 'nextou-prod'
for name, service in config['services'].items():
    service.pop('build', None)
    service['logging'] = {'driver': 'json-file', 'options': {'max-size': '10m', 'max-file': '3'}}
    if name in ('backend', 'worker', 'scheduler'):
        service['image'] = 'nextou-aws-backend:local'
        service['env_file'] = [{'path': 'app.env', 'required': True}]
    elif name.startswith('recommendation'):
        service['image'] = 'nextou-aws-recommendation:local'
        service['env_file'] = [{'path': 'db.env', 'required': True}]
    elif name == 'db':
        service.pop('env_file', None)
        service['image'] = 'postgres:15-alpine@sha256:f7d23353e1b15400d22ebe31189f4d314b87a4c129cc400c8c2d8d4ca127bf81'
    elif name == 'redis':
        service['image'] = 'redis:7-alpine@sha256:6ab0b6e7381779332f97b8ca76193e45b0756f38d4c0dcda72dbb3c32061ab99'
    elif name == 'frontend':
        service['image'] = 'nextou-aws-frontend:local'
        service['ports'] = ['80:80', '443:443']
        service['volumes'].extend([
            {'type': 'bind', 'source': '/etc/letsencrypt', 'target': '/etc/letsencrypt', 'read_only': True},
            {'type': 'bind', 'source': '/var/www/acme', 'target': '/var/www/acme', 'read_only': True}])
        for volume in service.get('volumes', []):
            if volume.get('target') == '/etc/nginx/conf.d/default.conf':
                volume['source'] = './nginx.conf'
                volume['read_only'] = True
                volume.pop('bind', None)
for volume in config.get('volumes', {}).values():
    volume.pop('name', None)
for network in config.get('networks', {}).values():
    network.pop('name', None)
(RELEASE / 'compose.json').write_text(json.dumps(config, indent=2), encoding='utf-8')
nginx = (ROOT / 'infra' / 'aws' / 'nginx.conf').read_text(encoding='utf-8')
additional_map = '\n'.join(f'    {host} {role};' for host, role in manifest.get('additionalHostMap', {}).items())
server_names = ' '.join(url.removeprefix('https://') for url in public_urls)
(RELEASE / 'nginx.conf').write_text(nginx.replace('@DOMAIN_SUFFIX@', manifest['domainSuffix'])
    .replace('@ADDITIONAL_HOST_MAP@', additional_map).replace('@SERVER_NAMES@', server_names), encoding='utf-8')
for unit in ('nextou-cert-renew.service', 'nextou-cert-renew.timer', 'nextou-stack.service'):
    shutil.copyfile(ROOT / 'infra' / 'aws' / unit, RELEASE / unit)
(RELEASE / 'bootstrap-admin.json').write_text(json.dumps(credentials['admin']), encoding='utf-8')
(RELEASE / 'bootstrap-admin.py').write_text(
    'import json\nfrom accounts.actions.auth_actions import SetupSuperUserAction\n'
    'from accounts.data.user_repository import UserRepository\n'
    'if not UserRepository.superuser_exists():\n'
    '    with open("/run/bootstrap-admin.json") as file:\n'
    '        SetupSuperUserAction(json.load(file)).execute()\n'
    'print("Administrator bootstrap verified.")\n', encoding='utf-8')
with tarfile.open(OUTPUT / 'release.tar.gz', 'w:gz') as archive:
    for file in RELEASE.iterdir():
        archive.add(file, arcname=file.name)
images_hash = hashlib.file_digest((OUTPUT / 'images.tar.gz').open('rb'), 'sha256').hexdigest()
release_hash = hashlib.file_digest((OUTPUT / 'release.tar.gz').open('rb'), 'sha256').hexdigest()
(OUTPUT / 'checksums.json').write_text(json.dumps({'images': images_hash, 'release': release_hash}), encoding='utf-8')
subprocess.run(['docker', 'compose', '-f', str(RELEASE / 'compose.json'), 'config', '--quiet'], cwd=RELEASE, check=True)
print('Private release prepared; production Compose configuration validated.')
