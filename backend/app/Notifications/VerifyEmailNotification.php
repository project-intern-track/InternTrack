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
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));

        $signedUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 1440)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Replace the Laravel API base URL with the frontend URL
        // so the link in the email goes to the frontend /verify-email page,
        // which then calls the Laravel signed route via a redirect.
        // Actually we keep the Laravel API URL since the route handles redirect.
        return $signedUrl;
    }
}
