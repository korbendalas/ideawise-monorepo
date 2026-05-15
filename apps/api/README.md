# Symfony API Skeleton

This folder is reserved for the Symfony 6 backend.

Recommended creation command during implementation:

```bash
composer create-project symfony/skeleton apps/api
cd apps/api
composer require symfony/orm-pack symfony/validator symfony/mime symfony/rate-limiter
composer require --dev symfony/test-pack
```

The API should implement the contract documented in [../../docs/api.md](../../docs/api.md).
