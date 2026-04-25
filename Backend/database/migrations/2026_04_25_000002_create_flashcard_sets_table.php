<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flashcard_sets', function (Blueprint $table) {
            $table->id();
            $table->string('user_key', 128);
            $table->string('title', 500);
            $table->string('subject', 32);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['user_key', 'subject']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flashcard_sets');
    }
};
