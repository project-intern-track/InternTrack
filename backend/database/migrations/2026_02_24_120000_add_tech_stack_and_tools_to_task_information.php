<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_information', function (Blueprint $table) {
        $table->json('tech_stack_categories')->nullable()->after('priority');
        $table->json('tools')->nullable()->after('tech_stack_categories');
        });
    }

    public function down(): void
    {
        Schema::table('task_information', function (Blueprint $table) {
            $table->dropColumn(['tech_stack_categories', 'tools']);
       });
    }
};
