<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('task_information')->cascadeOnDelete();
            $table->foreignId('intern_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->json('competency_ratings');
            $table->timestamps();
            $table->unique(['task_id', 'intern_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_feedback');
    }
};
