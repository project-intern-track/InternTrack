<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', [
                'pending_supervisor_review',
                'todo',
                'in_progress',
                'pending_completion_review',
                'completed',
                'rejected',
                'for_revision',
            ])->default('pending_supervisor_review');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->date('due_date');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_comments')->nullable();
            $table->text('revision_reason')->nullable();
            $table->string('revision_category')->nullable();
            $table->timestamps();

            $table->index('assigned_to');
            $table->index('created_by');
            $table->index('status');
            $table->index('priority');
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
