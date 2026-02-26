<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * GET /api/tasks
     * Admin: all tasks. Auto-marks overdue tasks before returning.
     */
    public function index(): JsonResponse
    {
        $this->markOverdueTasks();

        $tasks = Task::with(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($task) => $this->formatTask($task));

        return response()->json(['data' => $tasks]);
    }

    /**
     * POST /api/tasks
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string',
            'due_date'     => 'required|date',
            'priority'     => 'required|in:low,medium,high',
            'intern_ids'   => 'required|array|min:1',
            'intern_ids.*' => 'integer|exists:users,id',
        ]);

        $task = Task::create([
            'title'       => $validated['title'],
            'description' => $validated['description'] ?? null,
            'due_date'    => $validated['due_date'],
            'priority'    => $validated['priority'],
            'status'      => 'not_started',
            'created_by'  => $request->user()->id,
        ]);

        $task->assignedInterns()->sync($validated['intern_ids']);
        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)], 201);
    }

    /**
     * GET /api/tasks/{id}
     */
    public function show(int $id): JsonResponse
    {
        $task = Task::with(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name'])
            ->findOrFail($id);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * PUT /api/tasks/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'sometimes|nullable|string',
            'due_date'     => 'sometimes|date',
            'priority'     => 'sometimes|in:low,medium,high',
            'status'       => 'sometimes|in:not_started,in_progress,pending,completed,rejected,overdue',
            'intern_ids'   => 'sometimes|array',
            'intern_ids.*' => 'integer|exists:users,id',
        ]);

        $task->update(collect($validated)->except('intern_ids')->toArray());

        if (isset($validated['intern_ids'])) {
            $task->assignedInterns()->sync($validated['intern_ids']);
        }

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * GET /api/tasks/my-tasks
     * Intern: returns their own assigned tasks. Auto-marks overdue before returning.
     */
    public function myTasks(Request $request): JsonResponse
    {
        $user = $request->user();

        // Auto-mark overdue only for this intern's tasks
        Task::whereHas('assignedInterns', fn($q) => $q->where('users.id', $user->id))
            ->whereNotIn('status', ['completed', 'rejected', 'overdue'])
            ->where('due_date', '<', Carbon::now())
            ->update(['status' => 'overdue']);

        $tasks = $user->assignedTasks()
            ->with('creator:id,full_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($task) => $this->formatTask($task));

        return response()->json(['data' => $tasks]);
    }

    /**
     * PUT /api/tasks/{id}/status
     * Intern updates their task status (cannot set rejected/overdue).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:not_started,in_progress,pending,completed',
        ]);

        $task = Task::whereHas('assignedInterns', function ($q) use ($request) {
            $q->where('users.id', $request->user()->id);
        })->findOrFail($id);

        $task->update(['status' => $validated['status']]);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * PUT /api/tasks/{id}/reject
     * Admin rejects a completed task with a required reason.
     * Only works if the task is currently 'completed'.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:1',
        ]);

        $task = Task::findOrFail($id);

        if ($task->status !== 'completed') {
            return response()->json([
                'error' => 'Only completed tasks can be rejected.',
            ], 422);
        }

        $task->update([
            'status'           => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private function markOverdueTasks(): void
    {
        Task::whereNotIn('status', ['completed', 'rejected', 'overdue'])
            ->where('due_date', '<', Carbon::now())
            ->update(['status' => 'overdue']);
    }

    private function formatTask(Task $task): array
    {
        return [
            'id'                     => $task->id,
            'title'                  => $task->title,
            'description'            => $task->description,
            'due_date'               => $task->due_date?->toISOString(),
            'priority'               => $task->priority,
            'status'                 => $task->status,
            'rejection_reason'       => $task->rejection_reason,
            'created_by'             => $task->created_by,
            'created_at'             => $task->created_at?->toISOString(),
            'assigned_interns'       => $task->assignedInterns ?? [],
            'assigned_interns_count' => $task->assignedInterns?->count() ?? 0,
            'creator'                => $task->creator ? [
                'id'        => $task->creator->id,
                'full_name' => $task->creator->full_name,
            ] : null,
        ];
    }
}
