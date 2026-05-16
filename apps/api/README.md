# Symfony Media Upload API

Symfony 6 backend for the media upload assignment.

## Run

From the repository root:

```bash
npm run dev:backend
```

API links:

```text
API base:      http://localhost:8000/api
Swagger UI:    http://localhost:8000/api-docs.html
OpenAPI JSON:  http://localhost:8000/api/doc.json
OpenAPI YAML:  http://localhost:8000/api/doc.yaml
```

## Useful Commands

```bash
npm run validate:backend
npm run test:backend
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
```
