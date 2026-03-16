<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_information', function (Blueprint $table) {
            if (!Schema::hasColumn('task_information', 'tech_stack_categories')) {
                $table->json('tech_stack_categories')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('task_information', 'tools')) {
                $table->json('tools')->nullable()->after('tech_stack_categories');
            }
        });
    }

    public function down(): void
    {
        Schema::table('task_information', function (Blueprint $table) {
            $cols = array_filter(['tech_stack_categories', 'tools'], fn($c) => Schema::hasColumn('task_information', $c));
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
