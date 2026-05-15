# Setup

## Prerequisites

- Node.js 20+
- pnpm 9+
- PHP 8.2+
- Composer
- Symfony CLI

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

## Start Web App

```bash
pnpm dev:web
```

## Start Mobile App

```bash
pnpm dev:mobile
```

## Create Symfony API

The API folder currently contains the assignment scaffold. During implementation, create the Symfony project in `apps/api`:

```bash
composer create-project symfony/skeleton apps/api
cd apps/api
composer require symfony/orm-pack symfony/validator symfony/mime symfony/rate-limiter
composer require --dev symfony/test-pack
```

## Start API

```bash
pnpm dev:api
```

## Environment

Recommended API environment values:

```dotenv
APP_ENV=dev
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
UPLOAD_TMP_DIR="%kernel.project_dir%/var/storage/tmp"
UPLOAD_MEDIA_DIR="%kernel.project_dir%/var/storage/media"
UPLOAD_CHUNK_SIZE=1048576
UPLOAD_MAX_CONCURRENT_CHUNKS=3
```
