<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intern_id')->constrained('users')->cascadeOnDelete();
            $table->tinyInteger('month');
            $table->smallInteger('year');
            $table->decimal('total_hours', 6, 1)->default(0);
            $table->integer('tasks_completed')->default(0);
            $table->decimal('attendance_percentage', 5, 2)->default(0);
            $table->integer('projects_count')->default(0);
            $table->text('overview')->nullable();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->tinyInteger('rating')->nullable();
            $table->text('feedback_comment')->nullable();
            $table->timestamps();

            $table->index('intern_id');
            $table->index(['month', 'year']);
            $table->unique(['intern_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_reports');
    }
};
