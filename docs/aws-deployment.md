# Nextou on AWS

Deployed to Nikhil Pradeep, AWS project `622308589716`, in Mumbai (`ap-south-1`).
AWS profile: `nexconnect-prod`.

| App | URL |
| --- | --- |
| Website | https://nex-connect.in/ |
| Customer | https://customer.nex-connect.in/ |
| Vendor | https://vendor.nex-connect.in/ |
| Delivery | https://delivery.nex-connect.in/ |
| Administrator | https://admin.nex-connect.in/ |

The main domain and `www.nex-connect.in` serve the customer shopping app. Each role subdomain serves its corresponding Angular app. The previous four SSLip URLs remain available.

The deployment uses a fresh PostgreSQL database. No previous production data or sample catalog was imported. An administrator was created; its login is stored in the Git-ignored `output/aws-deployment/administrator-login.txt`, restricted to the local Windows user. The Orbit Rush game and its local preview were removed.

## Hosting

EC2 `i-0e5681a5cb534dde7` runs the existing eight-service Docker Compose stack: frontend, Django API, worker, scheduler, PostgreSQL, Redis, recommendation service, and recommendation trainer. Instance type is `t3.small`, with standard CPU credits, 30 GiB encrypted gp3 storage, IMDSv2, and 2 GiB swap. The EBS volume is retained on termination, and API termination protection is enabled.

Elastic IP `13.200.169.80` provides stable addressing. Squarespace DNS A records for the main domain, `www`, and four app subdomains point to this IP. Let's Encrypt certificates cover these six custom hostnames and the four temporary SSLip hostnames; a systemd timer checks renewal twice daily and reloads Nginx. Port 80 serves certificate challenges and redirects other requests to HTTPS. Only ports 80 and 443 are exposed. Administration uses Systems Manager, with no SSH port or key.

All four public HTTPS sites, Angular bundles, deep links, API readiness, empty catalog, administrator authentication, API authorization, secure refresh cookies, authenticated WebSocket connections, and Django static files passed verification. All eight production containers are running; recommendation, database, cache, and queue checks passed. The certificate renewal dry run succeeded, and the startup service and renewal timer are enabled.

CloudFront distribution creation was rejected by AWS because the new project needs additional verification. Hosting therefore uses EC2 directly. Unused CloudFront setup resources were removed. AWS Settings/Support verification is needed before adding CloudFront in the future.

This is a single-server deployment; the persistent database and uploaded files reside on its encrypted disk. Database backups and high availability are not configured.

The base on-demand cost is approximately **US$22.74/month** for 730 server hours, 30 GiB gp3, and one public IPv4 address. Traffic, S3 artifacts/logs, and taxes are additional. The project currently has an active Free plan with US$100 in credits, expiring April 3, 2027. Credits do not make the resources permanently free.

## Configuration and operations

Production files live in `/opt/nextou`. Local preparation scripts and service definitions live in `infra/aws`. The private release is assembled under the Git-ignored `output/aws-deployment` directory and uploaded to an encrypted, private deployment bucket. Release artifacts and management logs expire after 30 days. No AWS access keys are embedded in images or the production application environment.

Gmail SMTP uses STARTTLS on port 587. Its app password is supplied through `output/aws-deployment/gmail-smtp.env`; this file is restricted to the Windows user. Production SMTP authentication was verified without sending an email.

Through a Systems Manager session:

```sh
cd /opt/nextou
docker compose -f compose.json ps
docker compose -f compose.json logs --tail 100 backend worker scheduler
systemctl status nextou-stack.service nextou-cert-renew.timer
```

Do not run `docker compose down --volumes` on this server: it deletes the shopping database and uploaded files. Never commit generated environment files, login details, or private release archives.

For a future release, rebuild the three app images, run `package-images.cjs`, and run `prepare-release.py` with the repository's Python virtual environment. Reuse the existing credentials and volumes. Transfer files through private S3 URLs and deploy through Systems Manager. The live verification script checks all four HTTPS sites, empty catalog, administrator login, secure cookies, authenticated API permissions, WebSocket handshake, and Django static files. Its empty-catalog assertion is intended for this initial fresh deployment only.

## Google Maps setting still required

The existing Maps API key rejects `https://nex-connect.in/location` with `RefererNotAllowedMapError`, confirmed during custom-domain browser verification. In Google Cloud Console → APIs & Services → Credentials → the Maps key → Website restrictions, ensure these exact custom-domain referrers are allowed while retaining any entries still needed:

```text
https://nex-connect.in/*
https://www.nex-connect.in/*
https://customer.nex-connect.in/*
https://vendor.nex-connect.in/*
https://delivery.nex-connect.in/*
https://admin.nex-connect.in/*
```

The app's manual location form remains available. Add stores, service areas, vendors, and catalog data through the administrator app before accepting orders.

## Payment integration

The existing Razorpay live credentials were carried into the backend environment. Payments were not exercised during deployment. Before accepting orders on this fresh database, configure the Razorpay dashboard webhook for `https://customer.nex-connect.in/sa/api/orders/razorpay-webhook/`, using the matching webhook secret from the existing local configuration. Review the old deployment's webhook routing before changing it so existing orders continue to receive their updates.
