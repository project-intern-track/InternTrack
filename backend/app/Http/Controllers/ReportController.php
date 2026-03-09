<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Task;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * GET /api/reports/interns
     * List all interns with aggregated stats built on the fly.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'intern')->with('supervisor:id,full_name');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $interns = $query->get();

        $data = $interns->map(function (User $intern) {
            $totalHours = Attendance::where('user_id', $intern->id)->sum('total_hours');
            $requiredHours = $intern->required_hours ?: 486; // Fallback to common OJT requirement
            
            // Calculate a basic completion percentage (just an estimate for UX)
            $attendancePercentage = min(100, round(($totalHours / max(1, $requiredHours)) * 100));

            $latestLog = Attendance::where('user_id', $intern->id)->latest('date')->first();
            $lastUpdate = $latestLog ? Carbon::parse($latestLog->date)->diffForHumans() : $intern->updated_at->diffForHumans();

            return [
                'id'         => $intern->id,
                'name'       => $intern->full_name,
                'email'      => $intern->email,
                'role'       => $intern->ojt_role ?: 'Intern',
                'hours'      => (int) $totalHours . 'h',
                'attendance' => $attendancePercentage . '%',
                'status'     => ucfirst($intern->status),
                'lastUpdate' => $lastUpdate,
                'supervisor' => $intern->supervisor?->full_name ?: 'None Assigned',
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/reports/interns/export
     */
    public function export(Request $request): StreamedResponse
    {
        $query = User::where('role', 'intern')->with('supervisor:id,full_name');
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        $interns = $query->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="intern-reports-' . now()->format('Y-m-d') . '.csv"',
        ];

        return response()->stream(function () use ($interns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Email', 'Role', 'OJT ID', 'Department', 'Supervisor', 'Status', 'Total Hours', 'Attendance %', 'Tasks Completed']);

            foreach ($interns as $intern) {
                $totalHours = Attendance::where('user_id', $intern->id)->sum('total_hours');
                $requiredHours = $intern->required_hours ?: 486;
                $attendancePct = min(100, round(($totalHours / max(1, $requiredHours)) * 100));

                $tasksCompleted = Task::whereHas('assignedInterns', function($q) use ($intern) {
                    $q->where('users.id', $intern->id);
                })->where('status', 'completed')->count();

                fputcsv($handle, [
                    $intern->full_name,
                    $intern->email,
                    $intern->ojt_role,
                    $intern->ojt_id,
                    $intern->department,
                    $intern->supervisor?->full_name,
                    ucfirst($intern->status),
                    (int) $totalHours,
                    $attendancePct,
                    $tasksCompleted,
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * GET /api/reports/interns/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $intern = User::where('id', $id)
            ->where('role', 'intern')
            ->with('supervisor:id,full_name')
            ->first();

        if (!$intern) {
            return response()->json(['error' => 'Intern not found.'], 404);
        }

        return response()->json([
            'data' => [
                'id'         => $intern->id,
                'name'       => $intern->full_name,
                'email'      => $intern->email,
                'role'       => $intern->ojt_role ?: 'Intern',
                'ojt_id'     => $intern->ojt_id,
                'department' => $intern->department,
                'supervisor' => $intern->supervisor?->full_name ?: 'None Assigned',
                'avatar_url' => $intern->avatar_url,
                'status'     => ucfirst($intern->status),
            ],
        ]);
    }

    /**
     * GET /api/reports/interns/{id}/weekly
     */
    public function weekly(Request $request, int $id): JsonResponse
    {
        $intern = User::where('id', $id)->where('role', 'intern')->first();
        if (!$intern) return response()->json(['error' => 'Intern not found.'], 404);

        // Determine this week's start and end date (Monday -> Sunday)
        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        
        $attendanceRecords = Attendance::where('user_id', $id)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->get();
            
        $totalHours = $attendanceRecords->sum('total_hours');
        
        $tasksThisWeek = Task::whereHas('assignedInterns', function($q) use ($id) {
                $q->where('users.id', $id);
            })
            ->whereBetween('updated_at', [$weekStart, $weekEnd])
            ->get();
            
        $completedTasks = $tasksThisWeek->where('status', 'completed');

        $dailyActivities = $attendanceRecords->map(function ($log) {
            return [
                'day'         => Carbon::parse($log->date)->format('l'),
                'description' => $log->time_in . ' to ' . ($log->time_out ?: 'Ongoing'),
                'hours'       => ((float) $log->total_hours) . 'h',
            ];
        })->values();

        $weekLabel = "Week " . $weekStart->weekOfYear . ": " . $weekStart->format('F j') . ' - ' . $weekEnd->format('j, Y');

        return response()->json([
            'data' => [
                'id'               => $id . '_' . $weekStart->weekOfYear,
                'week_label'       => $weekLabel,
                'week_start'       => $weekStart->toDateString(),
                'week_end'         => $weekEnd->toDateString(),
                'total_hours'      => (float) $totalHours,
                'total_tasks'      => $tasksThisWeek->count(),
                'daily_activities' => $dailyActivities,
                'achievements'     => $completedTasks->pluck('title'),
                'challenges'       => 'Keep pushing! Track daily hours consistently.',
            ],
        ]);
    }

    /**
     * GET /api/reports/interns/{id}/monthly
     */
    public function monthly(Request $request, int $id): JsonResponse
    {
        $intern = User::where('id', $id)->where('role', 'intern')->first();
        if (!$intern) return response()->json(['error' => 'Intern not found.'], 404);

        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        $attendanceRecords = Attendance::where('user_id', $id)
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->get();
            
        $totalHours = $attendanceRecords->sum('total_hours');
        
        // Approx 22 working days in a month. Limit to 100%.
        $attendancePercentage = min(100, round(($attendanceRecords->count() / 22) * 100));

        $tasksThisMonth = Task::whereHas('assignedInterns', function($q) use ($id) {
                $q->where('users.id', $id);
            })->whereBetween('updated_at', [$monthStart, $monthEnd])->get();
            
        $completedTasks = $tasksThisMonth->where('status', 'completed');
        
        // Build unique tech stacks (skills) from all tasks
        $skillsSet = [];
        foreach ($completedTasks as $task) {
            $categories = is_string($task->tech_stack_categories) ? json_decode($task->tech_stack_categories, true) : $task->tech_stack_categories;
            if (is_array($categories)) {
                foreach ($categories as $cat) {
                    if (!isset($skillsSet[$cat])) {
                        $skillsSet[$cat] = 0;
                    }
                    $skillsSet[$cat] += 20; // 20% bump per task with this skill
                }
            }
        }
        
        $skillsList = [];
        foreach ($skillsSet as $name => $prof) {
            $skillsList[] = [
                'skill_name' => $name,
                'proficiency' => min(100, 30 + $prof) . "%" // start at 30% baseline
            ];
        }

        // Project/Task breakdown
        $projectsList = $completedTasks->map(function ($task) {
            return [
                'title'       => $task->title,
                'description' => substr($task->description, 0, 80) . '...',
                'role'        => 'Contributor',
                'status'      => 'Completed',
            ];
        })->values();

        // ──── Evaluation Fetch ────
        // Find latest evaluation by their supervisor
        $latestEvaluation = DB::table('evaluations')->where('intern_id', $id)->latest('created_at')->first();
        $supervisorFeedback = null;
        if ($latestEvaluation) {
            $supervisorFeedback = [
                'supervisor_name' => $intern->supervisor?->full_name ?: 'System',
                'rating'          => $latestEvaluation->score ?: 5,
                'comment'         => $latestEvaluation->feedback ?: 'No comments provided.',
            ];
        }

        return response()->json([
            'data' => [
                'id'                    => $id . '_' . $monthStart->month,
                'month_year'            => $now->format('F Y'),
                'month'                 => $now->month,
                'year'                  => $now->year,
                'total_hours'           => (float) $totalHours,
                'tasks_completed'       => $completedTasks->count(),
                'attendance_percentage' => $attendancePercentage,
                'projects_count'        => $completedTasks->count(),
                'overview'              => "Completed " . $completedTasks->count() . " tasks this month, accumulating " . $totalHours . " total hours.",
                'skills'                => $skillsList,
                'projects'              => $projectsList,
                'supervisor_feedback'   => $supervisorFeedback,
            ],
        ]);
    }
}
