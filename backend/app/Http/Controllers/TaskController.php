<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Allowed status transitions for interns.
     */
    private const INTERN_STATUS_TRANSITIONS = [
        'todo' => 'in_progress',
        'in_progress' => 'pending_completion_review',
    ];

    /**
     * Statuses visible to interns on their task list.
     */
    private const INTERN_VISIBLE_STATUSES = [
        'todo',
        'in_progress',
        'pending_completion_review',
        'completed',
    ];

    /**
     * List tasks assigned to the authenticated intern.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Task::forIntern($user->id)
            ->whereIn('status', self::INTERN_VISIBLE_STATUSES);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $query->orderBy('due_date', 'asc');

        return response()->json($query->get());
    }

    /**
     * Show a single task assigned to the authenticated intern.
     */
    public function show(Request $request, $id)
    {
        $task = Task::where('id', $id)
            ->where('assigned_to', $request->user()->id)
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        return response()->json($task);
    }

    /**
     * Update task status (intern can only move through allowed transitions).
     */
    public function updateStatus(Request $request, $id)
    {
        $task = Task::where('id', $id)
            ->where('assigned_to', $request->user()->id)
            ->first();

        if (!$task) {
            return response()->json(['error' => 'Task not found.'], 404);
        }

        $request->validate([
            'status' => 'required|string',
        ]);

        $newStatus = $request->status;
        $currentStatus = $task->status;

        // Check if this is a valid transition
        $allowedNext = self::INTERN_STATUS_TRANSITIONS[$currentStatus] ?? null;

        if ($allowedNext !== $newStatus) {
            return response()->json([
                'error' => "Invalid status transition from '{$currentStatus}' to '{$newStatus}'.",
            ], 422);
        }

        $task->update(['status' => $newStatus]);

        return response()->json($task->refresh());
    }
}
