<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AIController;

Route::post('/ai', [AIController::class, 'ask']);

Route::get('/', function () {
    return view('welcome');
});
