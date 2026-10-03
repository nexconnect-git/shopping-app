# GitHub Actions deployment

The `CI and production deployment` workflow in `nexconnect-git/shopping-app` builds the exact backend and frontend commits pinned by this repository, plus the recommendation service. Pull requests run the image builds and application checks. Pushes to `main` and manual runs on `main` deploy after every check passes.

## Connected production server

- AWS project: `622308589716`, Region: Mumbai (`ap-south-1`).
- Server: `i-0e5681a5cb534dde7`, public IP `13.200.169.80`.
- Application directory: `/opt/nextou`; Compose project: `nextou-prod`.
- Private release bucket: `nextou-deployment-622308589716-ap-south-1`, prefix `github-releases/`.
- GitHub OIDC role: `Nextou-GitHub-Deploy`.
- Systems Manager command document: `Nextou-DeployRelease`.
- GitHub environment: `production`, restricted to `main`.

GitHub receives temporary AWS credentials through OIDC. Its role can upload release artifacts and run only the deployment document against this server. `ssm:GetCommandInvocation` requires an unscoped resource because AWS does not support resource-level permissions for that action. The EC2 role can read only the release prefix. No SSH port, SSH private key, or permanent AWS access key is required.

The environment uses these non-secret variables:

| Variable | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::622308589716:role/Nextou-GitHub-Deploy` |
| `DEPLOY_BUCKET` | `nextou-deployment-622308589716-ap-south-1` |
| `DEPLOY_INSTANCE_ID` | `i-0e5681a5cb534dde7` |

Production credentials remain in the server's existing environment files. They are not copied into releases, workflow artifacts, or GitHub variables. Google Maps browser configuration is injected from the existing server environment at frontend startup.

## Release process

1. Check out the parent repository and its pinned public submodules.
2. Build three production Docker images. The frontend image builds all four Angular applications and the shared packages. Check Django configuration, missing migrations and migration application against a fresh SQLite database; check frontend output and recommendation imports.
3. Transfer the tested images between jobs using one-day GitHub artifacts. Tag images with the commit SHA, workflow run ID and run attempt.
4. Upload an encrypted release archive to private S3. Systems Manager downloads it with the server role, checks its SHA-256 checksum and validates its file list before extraction. The deploy script also checks each image archive.
5. Acquire a server deployment lock, load the images, stop application writers and save a private PostgreSQL dump in `/opt/nextou/backups/`. The database and Redis keep running.
6. Update only the application image references in the existing `compose.json`. Apply migrations, collect static files, restart the six application services and wait for readiness.
7. Check all HTTPS app routes, all eight container states, and Nginx configuration. Record `/opt/nextou/current-release.json`, remove redundant transfer files, and retain the current and preceding Docker image versions.
8. Verify public HTTPS pages, Angular bundles, deep links, role routing and backend dependency readiness from GitHub.

This single-server update has a short maintenance window while application writers are stopped, the database is backed up, and services are restarted. It does not delete or replace database, uploaded-file or recommendation-model volumes. The existing HTTPS certificates, Nginx settings and application environment files are preserved. Changes to these server settings require a separate explicit configuration update; editing the old production Compose template alone does not change live settings through this pipeline.

## Updating the submodules

Commit and push backend/frontend changes in their respective repositories first. Then update their gitlinks in `shopping-app` and push that parent change to `main`. A push to a submodule repository alone does not update the release: pinning ensures deployments are reproducible and reviewed together.

For a manual release, open Actions → CI and production deployment → Run workflow and select `main`. Runs on other branches cannot deploy. Production deployments are serialized and are not cancelled when another push arrives.

## Failure and recovery

Build failures never reach the server. A failed server migration, startup or health check restores the preceding Compose image references and tries to restart them. Applied database migrations are **not automatically reversed**; keep migrations compatible with the preceding application version. If a schema change prevents recovery, an operator must inspect the saved PostgreSQL dump before restoring it, because restoring a database can discard subsequent writes.

Inspect Actions logs and the printed Systems Manager command ID. On the host:

```sh
cd /opt/nextou
docker compose -f compose.json ps
docker compose -f compose.json logs --tail 100 backend worker scheduler recommendation
cat current-release.json
ls -ld backups/release-*
```

Do not run `docker compose down --volumes`. Database snapshots are retained on the encrypted server disk; monitor their size and apply a suitable retention/off-server backup policy. S3 release artifacts inherit the bucket's existing 30-day expiration. Failed transfers may remain under `/opt/nextou/releases/` for diagnosis.

The checked-in IAM policies and Systems Manager document in `infra/cicd/` describe the live connection and can be reviewed when changing deployment access.
