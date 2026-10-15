#!/bin/bash
set -euo pipefail
dnf install -y docker
systemctl enable --now docker amazon-ssm-agent
install -d -m 755 /usr/local/lib/docker/cli-plugins
compose_version=v5.6.0
curl -fsSL "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
curl -fsSL "https://github.com/docker/compose/releases/download/${compose_version}/docker-compose-linux-x86_64.sha256" -o /tmp/compose.sha256
cd /usr/local/lib/docker/cli-plugins
sed 's/docker-compose-linux-x86_64/docker-compose/' /tmp/compose.sha256 | sha256sum -c -
chmod 755 docker-compose
if ! swapon --show | grep -q /swapfile; then
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
install -d -m 700 /opt/nextou
docker compose version
