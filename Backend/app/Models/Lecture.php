<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lecture extends Model
{
    protected $fillable = [
        'title',
        'description',
        'subject',
        'duration',
        'type',
        'file_url',
        'video_url',
    ];
}
