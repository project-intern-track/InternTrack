<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'full_name',
        'avatar_url',
        'role',
        'ojt_role',
        'ojt_id',
        'start_date',
        'required_hours',
        'ojt_type',
        'status',
        'supervisor_id',
        'department',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'start_date' => 'date',
        ];
    }

    // ── Custom Notifications ──

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    // ── Relationships ──

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function interns()
    {
        return $this->hasMany(User::class, 'supervisor_id');
    }

    public function settings()
    {
        return $this->hasOne(UserSetting::class);
    }

    public function assignedTasks()
    {
        return $this->belongsToMany(\App\Models\Task::class, 'task_user');
    }
}
