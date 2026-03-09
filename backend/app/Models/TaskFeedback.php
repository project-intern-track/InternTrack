<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskFeedback extends Model
{
    protected $table = 'task_feedback';

    protected $fillable = [
        'task_id',
        'intern_id',
        'supervisor_id',
        'competency_ratings',
    ];

    protected function casts(): array
    {
        return [
            'competency_ratings' => 'array',
        ];
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function intern()
    {
        return $this->belongsTo(User::class, 'intern_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
