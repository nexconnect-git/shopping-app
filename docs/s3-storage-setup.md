# S3 File Storage Setup

This project stores uploads through Django's configured default storage. Angular uploads files only to Django; AWS credentials must never be placed in Angular code.

## Local Filesystem Setup

Use local storage when developing without AWS:

```env
DJANGO_ENV=local
USE_S3=false
FILE_UPLOAD_MAX_SIZE=10485760
```

Run:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Uploaded files are saved under `backend/media/` and served from `/media/` when `DEBUG=True`.

## Dev S3 Setup

Use S3 for the dev environment:

```env
DJANGO_ENV=dev
USE_S3=true
AWS_STORAGE_BUCKET_NAME=nex-connect-sa-bucket-dev-01
AWS_S3_REGION_NAME=ap-southeast-2
AWS_ACCESS_KEY_ID=REPLACE_WITH_DEV_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=REPLACE_WITH_DEV_SECRET_ACCESS_KEY
AWS_LOCATION=media
```

Store real credentials only in a local `.env` file or your deployment secret manager. Do not commit `.env`, access keys, or secret keys.

The S3 backend uses:

- Private object access
- `AWS_DEFAULT_ACL=None`
- `AWS_S3_FILE_OVERWRITE=False`
- `media/` as the object key prefix

### Docker Compose Environment Check

The local Docker backend reads S3 variables from the root `.env` file through `docker-compose.yml`.

After changing `.env`, restart the backend services:

```powershell
docker compose up -d backend worker scheduler
```

Confirm Django is using S3:

```powershell
docker exec shopping-app-backend-1 python manage.py shell -c "from django.conf import settings; print(settings.USE_S3, settings.STORAGES['default']['BACKEND'], settings.AWS_STORAGE_BUCKET_NAME)"
```

Expected S3 output:

```text
True storages.backends.s3.S3Storage nex-connect-sa-bucket-dev-01
```

## Angular Test Upload

The admin app includes a small upload test page:

```text
http://localhost:4200/files/upload-test
```

The page calls:

- `POST /api/files/upload/`
- `GET /api/files/`
- `GET /api/files/<id>/`

Angular sends multipart form data to Django. It does not use or expose AWS credentials.

The upload test page keeps queued uploads in browser IndexedDB. If the page is refreshed during an upload, the file and upload id are restored locally and the upload is retried automatically when the page loads again. The backend stores `client_upload_id` with each upload, so a retry returns the already-created file instead of creating a duplicate if the first request completed on the server.

Uploads are stored with this key format in both local storage and S3:

```text
<username>/<ddmmyyyy>/<use_of_image>/<filename>
```

For example:

```text
testvendor/24052026/product_image/rice-bag.jpg
```

The test upload endpoint accepts `use_of_image` in the multipart request. Supported values are:

- `profile_image`
- `cover_image`
- `product_image`
- `category_image`
- `vendor_document`
- `delivery_document`
- `order_attachment`
- `delivery_proof`
- `transaction_proof`
- `invoice`
- `banner_image`
- `general_upload`

## Dev Bucket CORS

Apply this CORS configuration to `nex-connect-sa-bucket-dev-01` for local admin app testing:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:4200"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

## Dev IAM Policy

Attach a least-privilege policy like this to the IAM principal used by the dev app:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListDevBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nex-connect-sa-bucket-dev-01"
      ]
    },
    {
      "Sid": "ReadWriteDeleteDevBucketObjects",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::nex-connect-sa-bucket-dev-01/*"
      ]
    }
  ]
}
```

## Verification

Local:

1. Set `DJANGO_ENV=local` and `USE_S3=false`.
2. Run migrations and start Django.
3. Open the Angular upload test page.
4. Upload a supported file.
5. Confirm the API returns a `file_url` pointing to `http://localhost:8000/media/...`.
6. Confirm the file exists under `backend/media/uploads/`.

Dev:

1. Set `DJANGO_ENV=dev`, `USE_S3=true`, bucket, region, and credentials in `.env` or secret manager.
2. Run migrations and start Django.
3. Open the Angular upload test page against the dev API.
4. Upload a supported file.
5. Confirm the object appears in `s3://nex-connect-sa-bucket-dev-01/media/uploads/`.
6. Confirm the API returns an S3-backed URL.
