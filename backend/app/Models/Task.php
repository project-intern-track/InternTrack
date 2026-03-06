<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'task_information';

    protected $fillable = [
        'title',
        'description',
        'due_date',
        'priority',
        'status',
        'tech_stack_categories',
        'tools',
        'rejection_reason',
        'revision_category',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'due_date'             => 'datetime',
            'approved_at'          => 'datetime',
            'tech_stack_categories' => 'array',
            'tools'                 => 'array',
        ];
    }

    public function assignedInterns()
    {
        return $this->belongsToMany(User::class, 'task_user');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
