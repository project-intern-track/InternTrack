<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_report_id')->constrained('weekly_reports')->cascadeOnDelete();
            $table->text('description');
            $table->timestamps();

            $table->index('weekly_report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_achievements');
    }
};
