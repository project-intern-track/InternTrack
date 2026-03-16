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
        // Force the signed URL to use APP_URL from config so it correctly
        // points to localhost in local dev and the live domain in production,
        // regardless of the current request context.
        URL::forceRootUrl(config('app.url'));

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
