<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * GET /api/announcements
     */
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::with('creator:id,full_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => $this->formatAnnouncement($a));

        $userNotifications = $request->user()->notifications->map(function ($n) {
            $taskId   = $n->data['task_id'] ?? null;
            $priority = $n->data['priority'] ?? 'low';

            if ($taskId) {
                $task     = Task::find($taskId);
                $priority = $task ? $task->priority : $priority;
            }

            return [
                'id'         => (string) $n->id,
                'title'      => $n->data['title'] ?? 'System Notification',
                'content'    => $n->data['content'] ?? '',
                'priority'   => $priority,
                'created_by' => 'system',
                'visibility' => 'specific',
                'created_at' => $n->created_at->toIso8601String(),
            ];
        });

        $merged = $announcements->concat($userNotifications)
            ->sortByDesc('created_at')
            ->values();

        return response()->json(['data' => $merged]);
    }

    /**
     * POST /api/announcements
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|in:low,medium,high',
        ]);

        $announcement = Announcement::create([
            'announcement_title'       => $validated['title'],
            'announcement_description' => $validated['content'],
            'priority'                => $validated['priority'],
            'created_by'              => $request->user()->id,
        ]);

        $announcement->load('creator:id,full_name');

        return response()->json(['data' => $this->formatAnnouncement($announcement)], 201);
    }

    private function formatAnnouncement(Announcement $a): array
    {
        return [
            'id'         => (string) $a->id,
            'title'      => $a->announcement_title,
            'content'    => $a->announcement_description ?? '',
            'priority'   => $a->priority,
            'created_by' => (string) $a->created_by,
            'visibility' => 'all',
            'created_at' => $a->created_at->toIso8601String(),
        ];
    }
}
