<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
use App\Notifications\SystemNotification;

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
            'title'                  => 'required|string|max:255',
            'description'            => 'nullable|string',
            'due_date'               => 'required|date',
            'priority'               => 'required|in:low,medium,high',
            'intern_ids'             => 'required|array|min:1',
            'intern_ids.*'           => 'integer|exists:users,id',
            'tech_stack_categories'   => 'nullable|array',
            'tech_stack_categories.*'=> 'string|max:255',
            'tools'                  => 'nullable|array',
            'tools.*'                 => 'string|max:255',
        ]);

        $task = Task::create([
            'title'                  => $validated['title'],
            'description'            => $validated['description'] ?? null,
            'due_date'               => $validated['due_date'],
            'priority'               => $validated['priority'],
            'status'                 => 'pending_approval',
            'tech_stack_categories'  => $validated['tech_stack_categories'] ?? null,
            'tools'                  => $validated['tools'] ?? null,
            'created_by'             => $request->user()->id,
        ]);

        $task->assignedInterns()->sync($validated['intern_ids']);
        $task->load(['assignedInterns.supervisor', 'creator:id,full_name']);

        $interns = $task->assignedInterns;
        Notification::send($interns, new SystemNotification('New Task Assigned', "You have been assigned to: {$task->title}", 'high'));
        
        $supervisors = $interns->pluck('supervisor')->filter()->unique();
        if ($supervisors->isNotEmpty()) {
            Notification::send($supervisors, new SystemNotification('Task Created', "A task was assigned to your intern: {$task->title}", 'medium'));
        }

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

        if ($task->status === 'rejected') {
            return response()->json([
                'error' => 'Rejected tasks cannot be edited or resubmitted.',
            ], 403);
        }

        $validated = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'sometimes|nullable|string',
            'due_date'     => 'sometimes|date',
            'priority'     => 'sometimes|in:low,medium,high',
            'status'       => 'sometimes|in:not_started,in_progress,pending,completed,rejected,overdue,pending_approval,needs_revision',
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
            ->whereNotIn('status', ['pending_approval', 'needs_revision', 'rejected'])
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
        })->with('assignedInterns.supervisor')->findOrFail($id);

        if ($task->status === 'rejected') {
            return response()->json([
                'error' => 'Rejected tasks cannot be updated.',
            ], 403);
        }

        $task->update(['status' => $validated['status']]);

        $statusText = str_replace('_', ' ', $validated['status']);
        $supervisors = $task->assignedInterns->pluck('supervisor')->filter()->unique();
        if ($supervisors->isNotEmpty()) {
            Notification::send($supervisors, new SystemNotification('Task Status Updated', "Task '{$task->title}' marked as {$statusText}", 'medium'));
        }

        if (in_array($validated['status'], ['in_progress', 'completed'])) {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new SystemNotification("Task {$statusText}", "Task '{$task->title}' is now {$statusText}.", 'low'));
        }

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

        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new SystemNotification('Task Rejected', "Task '{$task->title}' was rejected.", 'high'));

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    // ── Supervisor Endpoints ────────────────────────────────────────────────

    /**
     * GET /api/tasks/supervisor
     * Returns tasks that are in the supervisor review lifecycle.
     *
     * NOTE: For now this returns all such tasks regardless of which supervisor
     * created them, so the feature works even before strict supervisor
     * assignments are fully wired in the UI.
     */
    public function supervisorTasks(Request $request): JsonResponse
    {
        $tasks = Task::whereIn('status', [
                'pending_approval', // For checking
                'not_started',
                'in_progress',
                'pending',
                'completed',
                'needs_revision',
                'rejected',
                'overdue',
            ])
            ->with(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($task) => $this->formatTask($task));

        return response()->json(['data' => $tasks]);
    }

    /**
     * PUT /api/tasks/{id}/approve
     * Supervisor approves a pending task → status becomes 'not_started'.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $task = Task::with('assignedInterns')->findOrFail($id);

        if ($task->status !== 'pending_approval') {
            return response()->json([
                'error' => 'Only tasks awaiting approval can be approved.',
            ], 422);
        }

        $task->update([
            'status'      => 'not_started',
            'approved_by' => $request->user()->id,
            'approved_at' => Carbon::now(),
        ]);

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * PUT /api/tasks/{id}/supervisor-reject
     * Supervisor rejects a pending task with a reason.
     */
    public function supervisorReject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:1',
        ]);

        $task = Task::with('assignedInterns')->findOrFail($id);

        if ($task->status !== 'pending_approval') {
            return response()->json([
                'error' => 'Only tasks with pending_approval status can be rejected.',
            ], 422);
        }

        $task->update([
            'status'           => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new SystemNotification('Task Rejected', "Task '{$task->title}' was rejected by supervisor.", 'high'));

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * PUT /api/tasks/{id}/request-revision
     * Supervisor sends a task back to admin for revision.
     */
    public function requestRevision(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'revision_reason'   => 'required|string|min:1',
            'revision_category' => 'required|string|in:Incomplete task details,Incorrect intern assignment,Deadline needs adjustment,Not aligned with objectives,Duplicate task,Other',
        ]);

        $task = Task::with('assignedInterns')->findOrFail($id);

        if ($task->status !== 'pending_approval') {
            return response()->json([
                'error' => 'Only tasks with pending_approval status can be sent for revision.',
            ], 422);
        }

        $task->update([
            'status'            => 'needs_revision',
            'rejection_reason'  => $validated['revision_reason'],
            'revision_category' => $validated['revision_category'],
        ]);

        $admins = User::where('role', 'admin')->get();
        Notification::send($admins, new SystemNotification('Task Revision', "Revision requested for task: '{$task->title}'", 'high'));

        $task->load(['assignedInterns:id,full_name,avatar_url', 'creator:id,full_name']);

        return response()->json(['data' => $this->formatTask($task)]);
    }

    /**
     * DELETE /api/tasks/{id}
     * Admin: permanently delete (archive) a task.
     */
    public function destroy(int $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $task->delete();
        return response()->json(['message' => 'Task deleted.']);
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private function markOverdueTasks(): void
    {
        $overdueTasks = Task::whereNotIn('status', ['completed', 'rejected', 'overdue'])
            ->where('due_date', '<', Carbon::now())
            ->with('assignedInterns.supervisor')
            ->get();

        if ($overdueTasks->isNotEmpty()) {
            $admins = User::where('role', 'admin')->get();
            foreach ($overdueTasks as $task) {
                $supervisors = $task->assignedInterns->pluck('supervisor')->filter()->unique();
                if ($supervisors->isNotEmpty()) {
                    Notification::send($supervisors, new SystemNotification('Task Overdue', "Task '{$task->title}' is overdue.", 'high'));
                }
                Notification::send($admins, new SystemNotification('Task Overdue', "Task '{$task->title}' is overdue.", 'high'));
            }
            Task::whereIn('id', $overdueTasks->pluck('id'))->update(['status' => 'overdue']);
        }
    }

    private function supervisorOwnsTask(User $supervisor, Task $task): bool
    {
        $internIds = User::where('supervisor_id', $supervisor->id)->pluck('id');
        return $task->assignedInterns->pluck('id')->intersect($internIds)->isNotEmpty();
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
            'tech_stack_categories'  => $task->tech_stack_categories,
            'tools'                  => $task->tools,
            'rejection_reason'       => $task->rejection_reason,
            'revision_category'      => $task->revision_category,
            'approved_by'            => $task->approved_by,
            'approved_at'            => $task->approved_at?->toISOString(),
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
