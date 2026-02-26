<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_information', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('due_date');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['not_started', 'in_progress', 'pending', 'completed', 'rejected', 'overdue'])->default('not_started');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('priority');
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_information');
    }
};
