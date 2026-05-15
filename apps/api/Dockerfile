FROM php:8.3-cli-alpine

RUN apk add --no-cache git unzip sqlite-dev icu-dev libzip-dev \
    && docker-php-ext-install pdo pdo_sqlite intl zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

EXPOSE 8000
