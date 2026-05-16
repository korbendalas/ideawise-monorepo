<?php
// Router script for PHP's built-in web server.
// In local development, serves existing static files directly and routes everything else through Symfony.

$requestUri = $_SERVER['REQUEST_URI'];
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$filePath = is_string($requestPath) ? __DIR__ . $requestPath : null;

if ($filePath !== null && is_file($filePath)) {
    return false; // let PHP serve the static file natively
}

// Symfony Runtime reads $_SERVER['SCRIPT_FILENAME'] to find the app file.
// Without this, it would re-read router.php instead of index.php and get
// an int back instead of the Kernel closure, producing a fatal TypeError.
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/index.php';

require __DIR__ . '/index.php';
