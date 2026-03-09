<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intern_id')->constrained('users')->onDelete('cascade');
            $table->string('intern_name'); // Not stored in DB, for frontend display only
            $table->foreignId('supervisor_id')->constrained('users')->onDelete('cascade');
            $table->integer('task_completion')->nullable();
            $table->string('competency_score')->nullable();
            $table->integer('score');
            $table->text('feedback')->nullable();
            $table->date('evaluation_date')->default(now());
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};