<?php

namespace App\Observers;

use App\Models\User;
use App\Models\UserSetting;

class UserObserver
{
    public function created(User $user): void
    {
        UserSetting::create(['user_id' => $user->id]);
    }
}
