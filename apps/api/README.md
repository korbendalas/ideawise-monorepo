# Symfony Media Upload API

Symfony 6 backend for the media upload assignment.

## Run

From the repository root:

```bash
pnpm dev:api
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
pnpm validate:api
pnpm test:api
./scripts/docker-compose.sh run --rm api php bin/console doctrine:migrations:migrate --no-interaction
./scripts/docker-compose.sh run --rm api php bin/console app:uploads:cleanup-incomplete
./scripts/docker-compose.sh run --rm api php bin/console app:media:cleanup-expired
```
