<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyActivity extends Model
{
    protected $fillable = [
        'weekly_report_id',
        'day_name',
        'description',
        'hours_worked',
    ];

    protected function casts(): array
    {
        return [
            'hours_worked' => 'decimal:1',
        ];
    }

    public function weeklyReport(): BelongsTo
    {
        return $this->belongsTo(WeeklyReport::class);
    }
}
