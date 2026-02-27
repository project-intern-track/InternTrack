<?php

namespace App\Observers;

use App\Models\User;
use App\Models\UserSetting;
use App\Models\PasswordHistory;

class UserObserver
{
    public function created(User $user): void
    {
        UserSetting::create(['user_id' => $user->id]);

        if ($user->password) {
            PasswordHistory::create([
                'user_id' => $user->id,
                'password' => $user->password
            ]);
        }
    }

    public function updated(User $user): void
    {
        if ($user->wasChanged('password') && $user->password) {
            PasswordHistory::create([
                'user_id' => $user->id,
                'password' => $user->password
            ]);
        }
    }
}
