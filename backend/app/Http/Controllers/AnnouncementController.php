<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * GET /api/announcements
     */
    public function index(): JsonResponse
    {
        $announcements = Announcement::with('creator:id,full_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($a) => $this->formatAnnouncement($a));

        return response()->json(['data' => $announcements]);
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
