<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_user', function (Blueprint $table) {
            $table->string('intern_status')->default('not_started')->after('task_id');
        });
    }

    public function down(): void
    {
        Schema::table('task_user', function (Blueprint $table) {
            $table->dropColumn('intern_status');
        });
    }
};
