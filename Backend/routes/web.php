<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AIController;
use App\Http\Controllers\FlashcardGenerateController;
use App\Http\Controllers\FlashcardItemController;
use App\Http\Controllers\FlashcardSetController;
use App\Http\Controllers\LectureController;
use App\Http\Controllers\LectureSummarizeController;
use App\Http\Controllers\NoteAssistController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\SimulationController;
use App\Http\Controllers\TtsController;

Route::post('/ai', [AIController::class, 'ask']);

Route::get('/notes', [NoteController::class, 'index']);
Route::post('/notes', [NoteController::class, 'store']);
Route::put('/notes/{id}', [NoteController::class, 'update'])->whereNumber('id');
Route::delete('/notes/{id}', [NoteController::class, 'destroy'])->whereNumber('id');

Route::post('/api/notes/assist', [NoteAssistController::class, 'assist']);

Route::get('/lectures', [LectureController::class, 'index']);
Route::get('/lectures/{id}', [LectureController::class, 'show'])->whereNumber('id');
Route::post('/lectures', [LectureController::class, 'store']);
Route::put('/lectures/{id}', [LectureController::class, 'update'])->whereNumber('id');
Route::delete('/lectures/{id}', [LectureController::class, 'destroy'])->whereNumber('id');

Route::post('/api/lectures/summarize', [LectureSummarizeController::class, 'summarize']);

Route::get('/flashcard-sets', [FlashcardSetController::class, 'index']);
Route::get('/flashcard-sets/{id}', [FlashcardSetController::class, 'show'])->whereNumber('id');
Route::post('/flashcard-sets', [FlashcardSetController::class, 'store']);
Route::put('/flashcard-sets/{id}', [FlashcardSetController::class, 'update'])->whereNumber('id');
Route::delete('/flashcard-sets/{id}', [FlashcardSetController::class, 'destroy'])->whereNumber('id');
Route::post('/flashcard-sets/{id}/cards', [FlashcardSetController::class, 'addCards'])->whereNumber('id');

Route::put('/flashcards/{id}', [FlashcardItemController::class, 'update'])->whereNumber('id');
Route::delete('/flashcards/{id}', [FlashcardItemController::class, 'destroy'])->whereNumber('id');

Route::post('/api/flashcard-sets/generate', [FlashcardGenerateController::class, 'generate']);

Route::post('/api/tts', [TtsController::class, 'synthesize']);

Route::post('/simulation/start', [SimulationController::class, 'startScenario']);
Route::post('/simulation/turn', [SimulationController::class, 'conversationTurn']);
Route::post('/simulation/evaluate', [SimulationController::class, 'evaluateAnswer']);

Route::get('/', function () {
    return view('welcome');
});
