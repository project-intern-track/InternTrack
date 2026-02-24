<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSetting extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'theme',
        'notifications_enabled',
        'email_updates',
        'dashboard_layout',
    ];

    protected function casts(): array
    {
        return [
            'notifications_enabled' => 'boolean',
            'email_updates' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
