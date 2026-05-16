# Setup

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop, including Docker Compose

Local PHP, Composer, and Symfony CLI are not required. The backend runs inside Docker.

## Install JavaScript Dependencies

Install dependencies:

```bash
npm install
```

## Start Backend API

From the repository root:

```bash
npm run dev:backend
```

The API and Swagger UI are available at:

```text
http://localhost:8000/api
http://localhost:8000/api-docs.html
```

The container installs Composer dependencies, creates the SQLite database, runs migrations, and starts PHP's built-in server.

To run the API in the background:

```bash
npm run dev:backend:detached
```

To follow backend logs:

```bash
npm run logs:backend
```

To stop the backend:

```bash
npm run stop:backend
```

## Backend Commands

```bash
npm run validate:backend
npm run test:backend
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
```

## Start Web App

```bash
npm run dev:web
```

## Start Mobile App

```bash
npm run dev:mobile
```

## Mobile API URL

Use the API URL that the simulator or device can reach.

For iOS simulator:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api npm run dev:mobile
```

For Android emulator:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api npm run dev:mobile
```

For a physical device, use the computer's LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000/api npm run dev:mobile
```

The mobile app requests gallery and camera permissions through Expo Image Picker. It persists completed upload history and incomplete upload draft metadata locally with AsyncStorage.

## Backend Environment

The backend uses SQLite and local filesystem storage by default:

```dotenv
APP_ENV=dev
DATABASE_URL="sqlite:///%kernel.project_dir%/var/data.db"
UPLOAD_CHUNK_SIZE=1048576
UPLOAD_TMP_DIR="%kernel.project_dir%/var/storage/tmp"
UPLOAD_MEDIA_DIR="%kernel.project_dir%/var/storage/media"
```
