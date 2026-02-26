<?php

namespace App\Providers;

use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        User::observe(UserObserver::class);

        // Auto-run migrations whenever someone starts `php artisan serve`
        if ($this->app->runningInConsole()) {
            \Illuminate\Support\Facades\Event::listen(
                \Illuminate\Console\Events\CommandStarting::class,
                function (\Illuminate\Console\Events\CommandStarting $event) {
                    if ($event->command === 'serve') {
                        $event->output->writeln('<info>Auto-migrating database before starting the server...</info>');
                        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true], $event->output);
                    }
                }
            );
        }
    }
}
