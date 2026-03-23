<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Task;
use App\Models\TaskFeedback;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DashboardTestDataSeeder extends Seeder
{
    private const ITEM_COUNT = 20;

    public function run(): void
    {
        $admin = User::where('email', 'admin@interntrack.com')->first();
        $supervisor = User::where('email', 'supervisor@interntrack.com')->first();

        if (!$admin || !$supervisor) {
            return;
        }

        $interns = $this->seedInterns($supervisor);
        $this->seedAnnouncements($admin);
        $tasks = $this->seedTasks($admin, $supervisor, $interns);
        $this->seedAttendance($interns);
        $this->seedEvaluations($supervisor, $interns);
        $this->seedFeedback($supervisor, $tasks);
    }

    private function seedInterns(User $supervisor): array
    {
        $roles = [
            'Frontend Developer',
            'Backend Developer',
            'QA Analyst',
            'UI/UX Designer',
            'Data Analyst',
        ];

        $interns = [];

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            $createdAt = Carbon::now()->subDays(self::ITEM_COUNT - $i);
            $verifiedAt = $i <= 16 ? $createdAt->copy()->addHours(3) : null;

            $intern = User::updateOrCreate(
                ['email' => sprintf('dashboard.intern%02d@interntrack.com', $i)],
                [
                    'full_name' => sprintf('Dashboard Intern %02d', $i),
                    'password' => 'password123',
                    'role' => 'intern',
                    'status' => $i <= 18 ? 'active' : 'archived',
                    'email_verified_at' => $verifiedAt,
                    'avatar_url' => sprintf('https://ui-avatars.com/api/?name=Dashboard+Intern+%02d&background=random', $i),
                    'ojt_id' => 2000 + $i,
                    'ojt_role' => $roles[($i - 1) % count($roles)],
                    'required_hours' => 500,
                    'ojt_type' => $i % 3 === 0 ? 'voluntary' : 'required',
                    'start_date' => Carbon::now()->subDays(60 - $i),
                    'supervisor_id' => $supervisor->id,
                    'department' => 'IT Department',
                ]
            );

            $intern->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->saveQuietly();

            $interns[] = $intern->fresh();
        }

        $primaryIntern = User::where('email', 'intern@interntrack.com')->first();
        if ($primaryIntern) {
            $interns[] = $primaryIntern;
        }

        return $interns;
    }

    private function seedAnnouncements(User $admin): void
    {
        $priorities = ['high', 'medium', 'low'];

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            $createdAt = Carbon::now()->subHours($i * 6);

            $announcement = Announcement::updateOrCreate(
                ['announcement_title' => sprintf('Dashboard Test Announcement %02d', $i)],
                [
                    'announcement_description' => sprintf(
                        'Seeded announcement %02d for dashboard and notification testing. This includes enough content to exercise cards, previews, and list pagination.',
                        $i
                    ),
                    'priority' => $priorities[($i - 1) % count($priorities)],
                    'created_by' => $admin->id,
                ]
            );

            $announcement->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ])->saveQuietly();
        }
    }

    private function seedTasks(User $admin, User $supervisor, array $interns): array
    {
        $statuses = [
            'pending_approval',
            'not_started',
            'in_progress',
            'pending',
            'completed',
            'needs_revision',
            'rejected',
            'overdue',
        ];
        $priorities = ['high', 'medium', 'low'];
        $tasks = [];
        $assignableInterns = collect($interns)->filter(fn (User $intern) => $intern->role === 'intern')->values();

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            $status = $statuses[($i - 1) % count($statuses)];
            $createdAt = Carbon::now()->subDays(self::ITEM_COUNT - $i)->setTime(9, 0);
            $dueDate = match ($status) {
                'overdue' => Carbon::now()->subDays(($i % 4) + 1),
                'completed' => Carbon::now()->subDays(($i % 5) + 1),
                default => Carbon::now()->addDays(($i % 8) + 2),
            };

            $task = Task::updateOrCreate(
                ['title' => sprintf('Dashboard Test Task %02d', $i)],
                [
                    'description' => sprintf(
                        'Seeded task %02d used for dashboard summaries, approvals, feedback, and task list testing.',
                        $i
                    ),
                    'due_date' => $dueDate,
                    'priority' => $priorities[($i - 1) % count($priorities)],
                    'status' => $status,
                    'tech_stack_categories' => ['React', 'Laravel', 'MySQL'],
                    'tools' => ['Git', 'Postman', 'Figma'],
                    'rejection_reason' => in_array($status, ['needs_revision', 'rejected'], true)
                        ? 'Seeded review note for QA and workflow testing.'
                        : null,
                    'revision_category' => $status === 'needs_revision'
                        ? 'Incomplete task details'
                        : null,
                    'approved_by' => in_array($status, ['not_started', 'in_progress', 'pending', 'completed', 'overdue'], true)
                        ? $supervisor->id
                        : null,
                    'approved_at' => in_array($status, ['not_started', 'in_progress', 'pending', 'completed', 'overdue'], true)
                        ? $createdAt->copy()->addDay()
                        : null,
                    'created_by' => $admin->id,
                ]
            );

            $task->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $status === 'completed'
                    ? $createdAt->copy()->addDays(5)
                    : $createdAt->copy()->addDays(2),
            ])->saveQuietly();

            $assignedInternIds = [
                $assignableInterns[($i - 1) % $assignableInterns->count()]->id,
                $assignableInterns[$i % $assignableInterns->count()]->id,
            ];

            $task->assignedInterns()->sync($assignedInternIds);

            foreach ($assignedInternIds as $offset => $internId) {
                $internStatus = match ($status) {
                    'completed' => $offset === 0 || $i % 3 !== 0 ? 'completed' : 'pending',
                    'in_progress' => $offset === 0 ? 'in_progress' : 'not_started',
                    'pending' => 'pending',
                    'overdue' => $offset === 0 ? 'in_progress' : 'not_started',
                    default => 'not_started',
                };

                $task->assignedInterns()->updateExistingPivot($internId, [
                    'intern_status' => $internStatus,
                ]);
            }

            $tasks[] = $task->fresh(['assignedInterns']);
        }

        return $tasks;
    }

    private function seedAttendance(array $interns): void
    {
        $statuses = ['present', 'present', 'present', 'late', 'excused'];

        foreach (collect($interns)->filter(fn (User $intern) => $intern->role === 'intern')->take(5) as $internIndex => $intern) {
            for ($day = 0; $day < self::ITEM_COUNT; $day++) {
                $date = Carbon::now()->subDays($day + ($internIndex * 2))->toDateString();
                $status = $statuses[($day + $internIndex) % count($statuses)];
                $timeIn = $status === 'late' ? '09:18:00' : '08:00:00';
                $timeOut = $status === 'excused' ? null : '17:00:00';
                $hours = $status === 'excused' ? 0 : 8;

                Attendance::updateOrCreate(
                    [
                        'user_id' => $intern->id,
                        'date' => $date,
                    ],
                    [
                        'time_in' => $timeIn,
                        'time_out' => $timeOut,
                        'total_hours' => $hours,
                        'status' => $status,
                    ]
                );
            }
        }
    }

    private function seedEvaluations(User $supervisor, array $interns): void
    {
        $feedbackSnippets = [
            'Shows steady ownership and communicates blockers early.',
            'Delivers clean work but still needs more consistency under time pressure.',
            'Good collaboration with teammates and improving technical confidence.',
            'Strong execution on assigned tasks and follows through well on revisions.',
        ];

        $evaluationInterns = collect($interns)->filter(fn (User $intern) => $intern->role === 'intern')->take(10)->values();

        for ($i = 1; $i <= self::ITEM_COUNT; $i++) {
            $intern = $evaluationInterns[($i - 1) % $evaluationInterns->count()];
            $evaluationDate = Carbon::now()->subDays($i);
            $score = 72 + (($i * 3) % 24);

            Evaluation::updateOrCreate(
                [
                    'intern_id' => $intern->id,
                    'evaluation_date' => $evaluationDate->toDateString(),
                ],
                [
                    'intern_name' => $intern->full_name,
                    'supervisor_id' => $supervisor->id,
                    'task_completion' => min(100, 65 + ($i % 30)),
                    'competency_score' => number_format(3.2 + (($i % 9) * 0.2), 1) . '/5',
                    'score' => $score,
                    'feedback' => sprintf(
                        'Seeded evaluation %02d. %s',
                        $i,
                        $feedbackSnippets[($i - 1) % count($feedbackSnippets)]
                    ),
                ]
            );
        }
    }

    private function seedFeedback(User $supervisor, array $tasks): void
    {
        $comments = [
            'Demonstrated strong ownership of the assigned deliverables.',
            'Needs clearer status updates but finished the work well.',
            'Handled revisions professionally and improved the output quality.',
            'Good progress overall with room to tighten delivery timelines.',
        ];

        $completedTasks = collect($tasks)
            ->filter(fn (Task $task) => $task->status === 'completed')
            ->values();

        foreach ($completedTasks as $taskIndex => $task) {
            $task->loadMissing('assignedInterns');

            foreach ($task->assignedInterns as $internIndex => $intern) {
                if ((($taskIndex + $internIndex) % 3) === 2) {
                    continue;
                }

                $baseRating = 3 + (($taskIndex + $internIndex) % 3);
                $competencyRatings = [
                    [
                        'competency' => 'Technical Skills',
                        'rating' => min(5, $baseRating),
                        'comment' => $comments[($taskIndex + $internIndex) % count($comments)],
                    ],
                    [
                        'competency' => 'Communication',
                        'rating' => max(2, min(5, $baseRating - 1)),
                        'comment' => 'Kept the team informed and responded to follow-ups.',
                    ],
                    [
                        'competency' => 'Teamwork',
                        'rating' => min(5, $baseRating),
                        'comment' => 'Worked well with the assigned group during execution.',
                    ],
                    [
                        'competency' => 'Timeliness',
                        'rating' => max(2, min(5, $baseRating - (($taskIndex + 1) % 2))),
                        'comment' => 'Managed deadlines reasonably well during the sprint.',
                    ],
                ];

                TaskFeedback::updateOrCreate(
                    [
                        'task_id' => $task->id,
                        'intern_id' => $intern->id,
                    ],
                    [
                        'supervisor_id' => $supervisor->id,
                        'competency_ratings' => $competencyRatings,
                    ]
                );
            }
        }
    }
}
