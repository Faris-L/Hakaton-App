<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FlashcardSet extends Model
{
    protected $fillable = [
        'user_key',
        'title',
        'subject',
        'description',
    ];

    public function cards(): HasMany
    {
        return $this->hasMany(Flashcard::class, 'flashcard_set_id');
    }
}
