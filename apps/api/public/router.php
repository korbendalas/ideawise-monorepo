<?php
// Router script for PHP's built-in web server.
// Serves existing static files directly; routes everything else through Symfony.

$requestUri = $_SERVER['REQUEST_URI'];
$filePath   = __DIR__ . parse_url($requestUri, PHP_URL_PATH);

if (is_file($filePath)) {
    return false; // let PHP serve the static file natively
}

// Symfony Runtime reads $_SERVER['SCRIPT_FILENAME'] to find the app file.
// Without this, it would re-read router.php instead of index.php and get
// an int back instead of the Kernel closure, producing a fatal TypeError.
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/index.php';

require __DIR__ . '/index.php';
