<?php

$origins = env('CORS_ALLOWED_ORIGINS');
$parsed = is_string($origins) && $origins !== ''
    ? array_values(array_filter(array_map('trim', explode(',', $origins))))
    : ['*'];

return [

    'paths' => ['api/*', 'ai', 'notes', 'notes/*', 'lectures', 'lectures/*', 'flashcard-sets', 'flashcard-sets/*', 'flashcards', 'flashcards/*', 'simulation/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $parsed,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
