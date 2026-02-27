<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternProject extends Model
{
    protected $fillable = [
        'monthly_report_id',
        'title',
        'description',
        'role',
        'status',
    ];

    public function monthlyReport(): BelongsTo
    {
        return $this->belongsTo(MonthlyReport::class);
    }
}
