<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonthlyReport extends Model
{
    protected $fillable = [
        'intern_id',
        'month',
        'year',
        'total_hours',
        'tasks_completed',
        'attendance_percentage',
        'projects_count',
        'overview',
        'supervisor_id',
        'rating',
        'feedback_comment',
    ];

    protected function casts(): array
    {
        return [
            'total_hours' => 'decimal:1',
            'attendance_percentage' => 'decimal:2',
        ];
    }

    public function intern(): BelongsTo
    {
        return $this->belongsTo(User::class, 'intern_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(InternSkill::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(InternProject::class);
    }
}
