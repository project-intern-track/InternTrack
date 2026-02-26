<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'assigned_to',
        'created_by',
        'status',
        'priority',
        'due_date',
        'reviewed_by',
        'reviewed_at',
        'review_comments',
        'revision_reason',
        'revision_category',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    // ── Scopes ──

    public function scopeForIntern($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }
}
