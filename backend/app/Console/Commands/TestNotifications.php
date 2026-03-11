<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\SystemNotification;

class TestNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $user = clone User::first();
        if ($user) {
            $user->notify(new SystemNotification('Test Title', 'Test Message', 'high'));
            $this->info("Notifications for user: " . $user->notifications()->count());
            $this->info("Latest notification: " . json_encode($user->notifications->first()->data));
        } else {
            $this->error("No users found.");
        }
    }
}
