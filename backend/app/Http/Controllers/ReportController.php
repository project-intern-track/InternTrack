<?php

namespace App\Http\Controllers;

use App\Models\MonthlyReport;
use App\Models\User;
use App\Models\WeeklyReport;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /api/reports/interns
     * List all interns with summary stats for the Reports list page.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'intern');

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

        $interns = $query->with('supervisor:id,full_name')->get();

        $data = $interns->map(function (User $intern) {
            $latestMonthly = MonthlyReport::where('intern_id', $intern->id)
                ->orderByDesc('year')
                ->orderByDesc('month')
                ->first();

            $totalHours = MonthlyReport::where('intern_id', $intern->id)->sum('total_hours');

            $attendance = $latestMonthly ? $latestMonthly->attendance_percentage : 0;

            $latestReport = MonthlyReport::where('intern_id', $intern->id)
                ->orderByDesc('updated_at')
                ->first();
            $lastUpdate = $latestReport ? $latestReport->updated_at : $intern->updated_at;

            return [
                'id'         => $intern->id,
                'name'       => $intern->full_name,
                'email'      => $intern->email,
                'role'       => $intern->ojt_role,
                'hours'      => (int) $totalHours . 'h',
                'attendance' => (int) $attendance . '%',
                'status'     => ucfirst($intern->status),
                'lastUpdate' => $lastUpdate->diffForHumans(),
                'supervisor' => $intern->supervisor?->full_name,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/reports/interns/{id}
     * Returns intern profile info for the report header.
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
                'role'       => $intern->ojt_role,
                'ojt_id'     => $intern->ojt_id,
                'department' => $intern->department,
                'supervisor' => $intern->supervisor?->full_name,
                'avatar_url' => $intern->avatar_url,
                'status'     => ucfirst($intern->status),
            ],
        ]);
    }

    /**
     * GET /api/reports/interns/{id}/weekly
     * Returns weekly report data with daily activities and achievements.
     */
    public function weekly(Request $request, int $id): JsonResponse
    {
        $intern = User::where('id', $id)->where('role', 'intern')->first();

        if (!$intern) {
            return response()->json(['error' => 'Intern not found.'], 404);
        }

        $query = WeeklyReport::where('intern_id', $id)
            ->with(['dailyActivities', 'achievements']);

        if ($request->filled('week_start')) {
            $query->where('week_start', $request->week_start);
        } else {
            $query->orderByDesc('week_start');
        }

        $report = $query->first();

        if (!$report) {
            return response()->json(['data' => null]);
        }

        $weekNumber = $report->week_start->weekOfYear;
        $weekLabel = "Week {$weekNumber}: " . $report->week_start->format('F j') . ' - ' . $report->week_end->format('j, Y');

        return response()->json([
            'data' => [
                'id'               => $report->id,
                'week_label'       => $weekLabel,
                'week_start'       => $report->week_start->toDateString(),
                'week_end'         => $report->week_end->toDateString(),
                'total_hours'      => (float) $report->total_hours,
                'total_tasks'      => $report->total_tasks,
                'daily_activities' => $report->dailyActivities->map(fn($a) => [
                    'day'         => $a->day_name,
                    'description' => $a->description,
                    'hours'       => (float) $a->hours_worked . 'h',
                ]),
                'achievements'     => $report->achievements->pluck('description'),
                'challenges'       => $report->challenges,
            ],
        ]);
    }

    /**
     * GET /api/reports/interns/{id}/monthly
     * Returns monthly report data with skills, projects, and supervisor feedback.
     */
    public function monthly(Request $request, int $id): JsonResponse
    {
        $intern = User::where('id', $id)->where('role', 'intern')->first();

        if (!$intern) {
            return response()->json(['error' => 'Intern not found.'], 404);
        }

        $query = MonthlyReport::where('intern_id', $id)
            ->with(['skills', 'projects', 'supervisor:id,full_name']);

        if ($request->filled('month') && $request->filled('year')) {
            $query->where('month', $request->month)->where('year', $request->year);
        } else {
            $query->orderByDesc('year')->orderByDesc('month');
        }

        $report = $query->first();

        if (!$report) {
            return response()->json(['data' => null]);
        }

        $monthYear = Carbon::createFromDate($report->year, $report->month, 1)->format('F Y');

        $supervisorFeedback = null;
        if ($report->supervisor_id) {
            $supervisorFeedback = [
                'supervisor_name' => $report->supervisor?->full_name,
                'rating'          => $report->rating,
                'comment'         => $report->feedback_comment,
            ];
        }

        return response()->json([
            'data' => [
                'id'                    => $report->id,
                'month_year'            => $monthYear,
                'month'                 => $report->month,
                'year'                  => $report->year,
                'total_hours'           => (float) $report->total_hours,
                'tasks_completed'       => $report->tasks_completed,
                'attendance_percentage' => (float) $report->attendance_percentage,
                'projects_count'        => $report->projects_count,
                'overview'              => $report->overview,
                'skills'                => $report->skills->map(fn($s) => [
                    'skill_name'  => $s->skill_name,
                    'proficiency' => $s->proficiency,
                ]),
                'projects'              => $report->projects->map(fn($p) => [
                    'title'       => $p->title,
                    'description' => $p->description,
                    'role'        => $p->role,
                    'status'      => $p->status,
                ]),
                'supervisor_feedback'   => $supervisorFeedback,
            ],
        ]);
    }
}
