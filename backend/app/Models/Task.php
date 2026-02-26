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
        'rejection_reason',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
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
}
