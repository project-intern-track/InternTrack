<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify Your Email - InternTrack')
            ->view('emails.verify-email', ['url' => $url]);
    }

    protected function verificationUrl($notifiable): string
    {
        // Determine the correct backend URL based on environment
        $appUrl = config('app.url');

        // If running on localhost, use the backend localhost URL
        // If running on production, use the website/domain URL from config
        if (app()->environment('local')) {
            $appUrl = 'http://localhost:8000'; // Backend URL for local dev
        } else {
            // In production, use the APP_URL which should be the actual domain
            $appUrl = config('app.url');
        }

        // Force the signed URL to use the determined URL
        URL::forceRootUrl($appUrl);

        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 1440)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}
