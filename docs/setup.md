# Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker
- docker-compose

Local PHP, Composer, and Symfony CLI are not required. The backend runs inside Docker.

## Install JavaScript Dependencies

If pnpm is not installed:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Then install dependencies:

```bash
pnpm install
```

## Start Backend API

From the repository root:

```bash
docker-compose up api
```

The API is available at:

```text
http://localhost:8000/api
```

The container installs Composer dependencies, creates the SQLite database, runs migrations, and starts PHP's built-in server.

## Backend Commands

```bash
docker-compose run --rm api composer validate --strict
docker-compose run --rm api vendor/bin/phpunit
docker-compose run --rm api php bin/console doctrine:migrations:migrate --no-interaction
docker-compose run --rm api php bin/console app:uploads:cleanup-incomplete
docker-compose run --rm api php bin/console app:media:cleanup-expired
```

## Start Web App

```bash
pnpm dev:web
```

## Start Mobile App

```bash
pnpm dev:mobile
```

## Backend Environment

The backend uses SQLite and local filesystem storage by default:

```dotenv
APP_ENV=dev
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
UPLOAD_CHUNK_SIZE=1048576
UPLOAD_TMP_DIR="%kernel.project_dir%/var/storage/tmp"
UPLOAD_MEDIA_DIR="%kernel.project_dir%/var/storage/media"
```
