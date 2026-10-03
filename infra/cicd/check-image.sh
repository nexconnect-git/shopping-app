#!/usr/bin/env bash
set -euo pipefail
app=$1
image=$2
case "$app" in
  backend)
    # Linux uses the real RQ integration; SQLite avoids external services here.
    docker run --rm --entrypoint sh \
      -e SECRET_KEY=ci-only-secret-not-for-production \
      -e DEBUG=False -e ALLOWED_HOSTS=localhost,127.0.0.1,testserver \
      -e EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend \
      -e EMAIL_HOST=smtp.example.com -e EMAIL_HOST_USER=ci -e EMAIL_HOST_PASSWORD=ci-placeholder \
      -e DEFAULT_FROM_EMAIL=ci@example.com \
      -e DB_ENGINE=django.db.backends.sqlite3 -e DB_NAME=/tmp/ci.sqlite3 \
      "$image" -ec 'python manage.py check && python manage.py makemigrations --check --dry-run && python manage.py migrate --noinput'
    ;;
  frontend)
    docker run --rm --entrypoint sh "$image" -ec '
      for app in customer vendor delivery admin; do
        test -s "/usr/share/nginx/html/$app/index.html"
        test -s "/usr/share/nginx/html/$app/runtime-config.js"
      done
      test -x /docker-entrypoint-runtime-config.sh'
    ;;
  recommendation)
    docker run --rm --entrypoint python -e RECOMMENDER_TRAIN_ON_STARTUP=False \
      "$image" -c 'from app.main import app, health; assert app.title; assert health().status == "ok"'
    ;;
  *) echo "Unknown application: $app" >&2; exit 1 ;;
esac
