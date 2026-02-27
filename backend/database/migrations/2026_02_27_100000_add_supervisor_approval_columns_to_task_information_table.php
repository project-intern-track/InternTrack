<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'pending_approval' and 'needs_revision' to the status enum
        DB::statement("ALTER TABLE task_information MODIFY COLUMN status ENUM('not_started','in_progress','pending','completed','rejected','overdue','pending_approval','needs_revision') DEFAULT 'not_started'");

        Schema::table('task_information', function (Blueprint $table) {
            $table->string('revision_category')->nullable()->after('rejection_reason');
            $table->foreignId('approved_by')->nullable()->after('revision_category')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('task_information', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['revision_category', 'approved_by', 'approved_at']);
        });

        // Revert enum to original values
        DB::statement("ALTER TABLE task_information MODIFY COLUMN status ENUM('not_started','in_progress','pending','completed','rejected','overdue') DEFAULT 'not_started'");
    }
};
