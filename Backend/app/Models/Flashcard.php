<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    protected $fillable = [
        'flashcard_set_id',
        'question',
        'answer',
        'difficulty',
    ];

    public function flashcardSet(): BelongsTo
    {
        return $this->belongsTo(FlashcardSet::class, 'flashcard_set_id');
    }
}
