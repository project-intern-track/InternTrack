<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    public $title;
    public $message;
    public $priority;
    public $taskId;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $message, $priority = 'low', $taskId = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->priority = $priority;
        $this->taskId = $taskId;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title'   => $this->title,
            'content' => $this->message,
            'priority' => $this->priority,
            'task_id' => $this->taskId,
        ];
    }
}
