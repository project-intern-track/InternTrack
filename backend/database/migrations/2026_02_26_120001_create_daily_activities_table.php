<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_report_id')->constrained('weekly_reports')->cascadeOnDelete();
            $table->string('day_name');
            $table->text('description');
            $table->decimal('hours_worked', 4, 1);
            $table->timestamps();

            $table->index('weekly_report_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_activities');
    }
};
