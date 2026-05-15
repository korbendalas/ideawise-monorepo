# Symfony Media Upload API

Symfony 6 backend for the media upload assignment.

## Run

From the repository root:

```bash
docker-compose up api
```

API base URL:

```text
http://localhost:8000/api
```

## Useful Commands

```bash
docker-compose run --rm api php bin/console doctrine:migrations:migrate --no-interaction
docker-compose run --rm api vendor/bin/phpunit
docker-compose run --rm api php bin/console app:uploads:cleanup-incomplete
docker-compose run --rm api php bin/console app:media:cleanup-expired
```
