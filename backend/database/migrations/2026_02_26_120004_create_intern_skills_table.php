<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intern_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monthly_report_id')->constrained('monthly_reports')->cascadeOnDelete();
            $table->string('skill_name');
            $table->tinyInteger('proficiency')->unsigned();
            $table->timestamps();

            $table->index('monthly_report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intern_skills');
    }
};
