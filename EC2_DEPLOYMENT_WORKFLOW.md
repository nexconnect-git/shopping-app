# EC2 Deployment Workflow

This project is deployed from a parent repository that ties together separate backend and frontend repositories.

## Repository Layout

| Path | Source | Notes |
| --- | --- | --- |
| `backend/` | `https://github.com/nexconnect-git/nexapp-shopping-api.git` | Django API submodule |
| `frontend/` | `https://github.com/nexconnect-git/nexapp-shopping-ui.git` | Angular monorepo submodule |
| `packages/` | parent repo | Shared local npm packages required by the frontend build |
| `nginx/` | parent repo | Production Nginx config |
| `docker-compose.prod.yml` | parent repo | EC2 production Compose file |

The EC2 server should clone only the parent repo:

```bash
git clone --recurse-submodules https://github.com/nexconnect-git/shopping-app.git
```

Do not clone backend and frontend separately on EC2 for production deployment.

## First-Time EC2 Setup

```bash
ssh ubuntu@YOUR_EC2_IP
cd ~

sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

git clone --recurse-submodules https://github.com/nexconnect-git/shopping-app.git
cd shopping-app
```

Create or restore the production `.env` file:

```bash
nano .env
```

Verify the required files exist:

```bash
ls -la backend/manage.py
ls -la frontend/package.json
ls -la packages/README.md
ls -la docker-compose.prod.yml
```

Start the stack:

```bash
sudo docker compose -f docker-compose.prod.yml up --build -d
```

Check logs:

```bash
sudo docker compose -f docker-compose.prod.yml logs -f backend
sudo docker compose -f docker-compose.prod.yml logs -f frontend
```

## Normal Development Push Flow

Always push backend and frontend changes to their own repositories first. Then update the parent repo so EC2 knows which commits to deploy.

### 1. Push Backend Changes

```powershell
cd D:\Projects\NexConnect\shopping-app\backend
git status
git add .
git commit -m "Describe backend change"
git push origin main
```

Skip the commit if there are no backend changes.

### 2. Push Frontend Changes

```powershell
cd D:\Projects\NexConnect\shopping-app\frontend
git status
git add .
git commit -m "Describe frontend change"
git push origin main
```

Skip the commit if there are no frontend changes.

### 3. Push Parent Deployment Repo

After backend/frontend are pushed, commit the parent repo. This records the latest submodule pointers and any deployment-level changes.

```powershell
cd D:\Projects\NexConnect\shopping-app
git status
git add backend frontend packages docker-compose.prod.yml nginx .dockerignore .gitmodules .env.example .env.prod.example
git commit -m "Bump app submodules and deploy config"
git push origin main
```

Do not commit `.env`.

If only backend changed, `git status` should show `backend` modified. If only frontend changed, it should show `frontend` modified. If shared packages changed, it should show files under `packages/`.

## Updating EC2 After A Push

```bash
ssh ubuntu@YOUR_EC2_IP
cd ~/shopping-app

git pull
git submodule update --init --recursive

sudo docker compose -f docker-compose.prod.yml up --build -d
```

Check status and logs:

```bash
sudo docker compose -f docker-compose.prod.yml ps
sudo docker compose -f docker-compose.prod.yml logs -f backend
sudo docker compose -f docker-compose.prod.yml logs -f frontend
```

## Clean Rebuild On EC2

Use this when Docker cache seems stale:

```bash
cd ~/shopping-app
git pull
git submodule update --init --recursive

sudo docker compose -f docker-compose.prod.yml down --remove-orphans
sudo docker compose -f docker-compose.prod.yml build --no-cache
sudo docker compose -f docker-compose.prod.yml up -d
```

## Important Checks

The frontend production Dockerfile requires the parent context. In `docker-compose.prod.yml`, the frontend build section must look like this:

```yaml
frontend:
  build:
    context: .
    dockerfile: frontend/docker/Dockerfile.prod
```

These files must exist on EC2 before deployment:

```bash
backend/manage.py
frontend/package.json
packages/README.md
```

If `packages/README.md` is missing, the frontend Docker build will fail at:

```text
COPY packages /packages
```

If `frontend/package.json` is missing, the server has not cloned the parent repo with submodules correctly.

## Troubleshooting

### Docker says `/frontend` or `/packages` not found

Check the parent repo structure:

```bash
cd ~/shopping-app
ls -la frontend/package.json
ls -la packages/README.md
sed -n '1,30p' docker-compose.prod.yml
```

Fix by pulling the parent repo and submodules:

```bash
git pull
git submodule update --init --recursive
```

If `packages/` is still missing, the parent repo was not pushed correctly from local.

### `version` warning in Docker Compose

Docker Compose v2 ignores the old top-level `version` field. Remove this line from `docker-compose.prod.yml`:

```yaml
version: "3.8"
```

### Server checkout is broken

Backup `.env`, move the broken folder aside, and clone fresh:

```bash
cd ~
mkdir -p ~/shopping-app-backup
sudo cp ~/shopping-app/.env ~/shopping-app-backup/.env 2>/dev/null || true
sudo mv ~/shopping-app ~/shopping-app.broken.$(date +%Y%m%d-%H%M%S)

git clone --recurse-submodules https://github.com/nexconnect-git/shopping-app.git
cd shopping-app
cp ~/shopping-app-backup/.env .env
sudo docker compose -f docker-compose.prod.yml up --build -d
```
