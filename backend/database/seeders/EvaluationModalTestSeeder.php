<?php

namespace Database\Seeders;

use App\Models\Evaluation;
use App\Models\Task;
use App\Models\TaskFeedback;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EvaluationModalTestSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@interntrack.com')->first();
        $supervisor = User::where('email', 'supervisor@interntrack.com')->first();

        if (!$admin || !$supervisor) {
            return;
        }

        $eligibleIntern = User::updateOrCreate(
            ['email' => 'evaluation.ready.intern@interntrack.com'],
            [
                'full_name' => 'Evaluation Ready Intern',
                'password' => 'password123',
                'role' => 'intern',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'avatar_url' => 'https://ui-avatars.com/api/?name=Evaluation+Ready+Intern&background=random',
                'ojt_id' => 3201,
                'ojt_role' => 'Frontend Developer',
                'required_hours' => 500,
                'ojt_type' => 'required',
                'start_date' => Carbon::now()->subDays(30),
                'supervisor_id' => $supervisor->id,
                'department' => 'IT Department',
            ]
        );

        $blockedIntern = User::updateOrCreate(
            ['email' => 'evaluation.blocked.intern@interntrack.com'],
            [
                'full_name' => 'Evaluation Blocked Intern',
                'password' => 'password123',
                'role' => 'intern',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'avatar_url' => 'https://ui-avatars.com/api/?name=Evaluation+Blocked+Intern&background=random',
                'ojt_id' => 3202,
                'ojt_role' => 'QA Analyst',
                'required_hours' => 500,
                'ojt_type' => 'required',
                'start_date' => Carbon::now()->subDays(28),
                'supervisor_id' => $supervisor->id,
                'department' => 'IT Department',
            ]
        );

        $eligibleTask = Task::updateOrCreate(
            ['title' => 'Evaluation Seed Task - Eligible Intern'],
            [
                'description' => 'Completed seeded task for an intern who should be eligible for evaluation because feedback exists.',
                'due_date' => Carbon::now()->subDays(5)->toDateString(),
                'priority' => 'high',
                'status' => 'completed',
                'tech_stack_categories' => ['React', 'Laravel'],
                'tools' => ['Git', 'Postman'],
                'approved_by' => $supervisor->id,
                'approved_at' => Carbon::now()->subDays(4),
                'created_by' => $admin->id,
            ]
        );

        $eligibleTask->assignedInterns()->sync([$eligibleIntern->id]);
        $eligibleTask->assignedInterns()->updateExistingPivot($eligibleIntern->id, [
            'intern_status' => 'completed',
        ]);

        TaskFeedback::updateOrCreate(
            [
                'task_id' => $eligibleTask->id,
                'intern_id' => $eligibleIntern->id,
            ],
            [
                'supervisor_id' => $supervisor->id,
                'competency_ratings' => [
                    [
                        'competency' => 'Technical Skills',
                        'rating' => 5,
                        'comment' => 'Built the assigned deliverable cleanly and with minimal revision.',
                    ],
                    [
                        'competency' => 'Communication',
                        'rating' => 4,
                        'comment' => 'Provided clear progress updates throughout the task.',
                    ],
                    [
                        'competency' => 'Teamwork',
                        'rating' => 4,
                        'comment' => 'Worked well with the assigned supervisor and teammates.',
                    ],
                    [
                        'competency' => 'Timeliness',
                        'rating' => 5,
                        'comment' => 'Completed the work on time and responded quickly to follow-ups.',
                    ],
                ],
            ]
        );

        $blockedTask = Task::updateOrCreate(
            ['title' => 'Evaluation Seed Task - Blocked Intern'],
            [
                'description' => 'Completed seeded task for an intern who should stay blocked from evaluation because no feedback is submitted.',
                'due_date' => Carbon::now()->subDays(6)->toDateString(),
                'priority' => 'medium',
                'status' => 'completed',
                'tech_stack_categories' => ['Testing', 'Documentation'],
                'tools' => ['Git', 'Jira'],
                'approved_by' => $supervisor->id,
                'approved_at' => Carbon::now()->subDays(5),
                'created_by' => $admin->id,
            ]
        );

        $blockedTask->assignedInterns()->sync([$blockedIntern->id]);
        $blockedTask->assignedInterns()->updateExistingPivot($blockedIntern->id, [
            'intern_status' => 'completed',
        ]);

        TaskFeedback::where('task_id', $blockedTask->id)
            ->where('intern_id', $blockedIntern->id)
            ->delete();

        Evaluation::whereIn('intern_id', [$eligibleIntern->id, $blockedIntern->id])->delete();
    }
}
