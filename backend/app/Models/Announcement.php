<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $table = 'admin_announcements';

    protected $fillable = [
        'announcement_title',
        'announcement_description',
        'priority',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
