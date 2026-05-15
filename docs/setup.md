# Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop, including Docker Compose

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
pnpm dev:api
```

The API and Swagger UI are available at:

```text
http://localhost:8000/api
http://localhost:8000/api-docs.html
```

The container installs Composer dependencies, creates the SQLite database, runs migrations, and starts PHP's built-in server.

To run the API in the background:

```bash
pnpm dev:api:detached
```

To follow backend logs:

```bash
pnpm logs:api
```

To stop the backend:

```bash
pnpm stop:api
```

## Backend Commands

```bash
pnpm validate:api
pnpm test:api
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
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
