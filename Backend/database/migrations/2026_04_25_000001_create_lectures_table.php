<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lectures', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->text('description')->nullable();
            $table->string('subject', 32);
            $table->string('duration', 64);
            $table->string('type', 16);
            $table->string('file_url', 2048)->nullable();
            $table->string('video_url', 2048)->nullable();
            $table->timestamps();

            $table->index('subject');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lectures');
    }
};
