<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AIController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\TtsController;

Route::post('/ai', [AIController::class, 'ask']);

Route::post('/api/tts', [TtsController::class, 'synthesize']);

Route::post('/simulation/start', [SimulationController::class, 'startScenario']);
Route::post('/simulation/turn', [SimulationController::class, 'conversationTurn']);
Route::post('/simulation/evaluate', [SimulationController::class, 'evaluateAnswer']);

Route::get('/', function () {
    return view('welcome');
});
