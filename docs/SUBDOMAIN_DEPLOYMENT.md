# NexConnect Subdomain Deployment Guide

This guide explains how to deploy the NexConnect shopping-app on AWS EC2 using subdomain-based routing.

## Subdomain Layout

| Subdomain | App |
|---|---|
| `nex-connect.in` | Redirects to customer.nex-connect.in |
| `customer.nex-connect.in` | Customer App |
| `vendor.nex-connect.in` | Vendor App |
| `delivery.nex-connect.in` | Delivery App |
| `admin.nex-connect.in` | Admin Panel |

---

## 1. DNS Setup

In your domain registrar / DNS provider (e.g. GoDaddy, Route 53, Cloudflare), add the following **A records** pointing to your EC2 instance's public IP address:

| Host / Name | Type | Value |
|---|---|---|
| `@` (or `nex-connect.in`) | A | `<EC2_PUBLIC_IP>` |
| `www` | A | `<EC2_PUBLIC_IP>` |
| `customer` | A | `<EC2_PUBLIC_IP>` |
| `vendor` | A | `<EC2_PUBLIC_IP>` |
| `delivery` | A | `<EC2_PUBLIC_IP>` |
| `admin` | A | `<EC2_PUBLIC_IP>` |

Replace `<EC2_PUBLIC_IP>` with the actual Elastic IP (or public IP) of your EC2 instance.

DNS propagation can take up to 24–48 hours, but typically resolves within minutes when using services like Cloudflare.

---

## 2. EC2 First-Time Setup

Refer to `EC2_DEPLOYMENT_WORKFLOW.md` for the complete Docker installation steps. Key steps summary:

1. Launch an EC2 instance (Ubuntu 22.04 LTS recommended, `t3.medium` or larger).
2. Open inbound ports in the Security Group: **22** (SSH), **80** (HTTP), **443** (HTTPS).
3. Assign an Elastic IP to the instance so the IP doesn't change on reboot.
4. SSH into the instance and install Docker + Docker Compose (see `EC2_DEPLOYMENT_WORKFLOW.md`).
5. Clone the repository:
   ```bash
   git clone <your-repo-url> /home/ubuntu/shopping-app
   cd /home/ubuntu/shopping-app
   ```

---

## 3. Environment Configuration (.env)

Copy `.env.example` to `.env` and update these key variables for subdomain deployment:

```env
# Backend allowed hosts — list all subdomains
ALLOWED_HOSTS=nex-connect.in,www.nex-connect.in,customer.nex-connect.in,vendor.nex-connect.in,delivery.nex-connect.in,admin.nex-connect.in

# CORS — allow all subdomains to call the API
CORS_ALLOWED_ORIGINS=https://customer.nex-connect.in,https://vendor.nex-connect.in,https://delivery.nex-connect.in,https://admin.nex-connect.in

# Frontend URLs
FRONTEND_URL=https://customer.nex-connect.in
CUSTOMER_APP_URL=https://customer.nex-connect.in
VENDOR_APP_URL=https://vendor.nex-connect.in
ADMIN_PANEL_URL=https://admin.nex-connect.in
DELIVERY_APP_URL=https://delivery.nex-connect.in
```

For the initial HTTP-only test (before SSL), use `http://` in the CORS and URL values.

---

## 4. Initial Deployment (HTTP only)

Before adding SSL, verify everything works over HTTP first:

```bash
cd /home/ubuntu/shopping-app
docker compose -f docker-compose.prod.yml up -d --build
```

Visit `http://customer.nex-connect.in` — you should see the customer app.

---

## 5. SSL Setup with Certbot

Install Certbot on the EC2 host (not inside Docker):

```bash
sudo apt update
sudo apt install certbot -y
```

Stop the Docker stack temporarily so Certbot can bind to port 80:

```bash
docker compose -f docker-compose.prod.yml down
```

Obtain certificates for all domains in one command:

```bash
sudo certbot certonly --standalone \
  -d nex-connect.in \
  -d www.nex-connect.in \
  -d customer.nex-connect.in \
  -d vendor.nex-connect.in \
  -d delivery.nex-connect.in \
  -d admin.nex-connect.in
```

Certbot will write certificates to:
- Certificate: `/etc/letsencrypt/live/nex-connect.in/fullchain.pem`
- Key: `/etc/letsencrypt/live/nex-connect.in/privkey.pem`

---

## 6. nginx/default.conf — Adding SSL (443) Server Blocks

After obtaining certificates, update `nginx/default.conf` to add 443 server blocks and redirect HTTP to HTTPS.

For each subdomain, change the port 80 server block to a redirect, and add a port 443 block. Example for **customer.nex-connect.in**:

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name customer.nex-connect.in;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    server_name customer.nex-connect.in;

    ssl_certificate     /etc/letsencrypt/live/nex-connect.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nex-connect.in/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html/customer;
    charset utf-8;
    client_max_body_size 20M;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        limit_req_status 429;
        proxy_pass         http://backend/api/;
        proxy_set_header   Host              $http_host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_redirect     off;
    }

    location /ws/ {
        proxy_pass         http://backend/ws/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto https;
        proxy_read_timeout 86400;
    }

    location /media/ {
        alias   /app/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /django_static/ {
        alias   /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Repeat this pattern for `vendor.nex-connect.in` (root `/usr/share/nginx/html/vendor`), `delivery.nex-connect.in` (root `/usr/share/nginx/html/delivery`), and `admin.nex-connect.in` (root `/usr/share/nginx/html/admin`).

For the root domain redirect:
```nginx
server {
    listen 80;
    server_name nex-connect.in www.nex-connect.in;
    return 301 https://customer.nex-connect.in$request_uri;
}
server {
    listen 443 ssl;
    server_name nex-connect.in www.nex-connect.in;
    ssl_certificate     /etc/letsencrypt/live/nex-connect.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nex-connect.in/privkey.pem;
    return 301 https://customer.nex-connect.in$request_uri;
}
```

You also need to mount the Let's Encrypt certificates into the nginx container. Add this to the `frontend` service volumes in `docker-compose.prod.yml`:
```yaml
- /etc/letsencrypt:/etc/letsencrypt:ro
```
And expose port 443:
```yaml
ports:
  - "80:80"
  - "443:443"
```

---

## 7. Certificate Auto-Renewal

Certbot sets up a systemd timer for auto-renewal. Verify it:

```bash
sudo systemctl status certbot.timer
```

Because Certbot runs on the host (not in Docker), renewal works without stopping the stack — as long as nginx is configured to handle the `/.well-known/acme-challenge/` path, or you use the `--webroot` plugin. The simplest approach for renewal is to keep using `--standalone` and add a pre/post hook to stop and restart the Docker stack:

```bash
# /etc/letsencrypt/renewal-hooks/pre/stop-docker.sh
#!/bin/bash
cd /home/ubuntu/shopping-app && docker compose -f docker-compose.prod.yml down
```

```bash
# /etc/letsencrypt/renewal-hooks/post/start-docker.sh
#!/bin/bash
cd /home/ubuntu/shopping-app && docker compose -f docker-compose.prod.yml up -d
```

Make both scripts executable:
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-docker.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/start-docker.sh
```

---

## 8. Normal Deploy Flow (After Code Pushes)

```bash
cd /home/ubuntu/shopping-app
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Docker Compose will rebuild only changed images. The `--build` flag ensures the Angular apps are recompiled with any code changes. Django migrations and static file collection run automatically on backend startup.

To check logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Just frontend/nginx
docker compose -f docker-compose.prod.yml logs -f frontend

# Just backend
docker compose -f docker-compose.prod.yml logs -f backend
```
