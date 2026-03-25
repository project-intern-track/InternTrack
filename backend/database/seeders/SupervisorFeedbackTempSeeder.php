<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\TaskFeedback;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SupervisorFeedbackTempSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@interntrack.com')->first();
        $supervisor = User::where('email', 'supervisor@interntrack.com')->first();

        if (!$admin || !$supervisor) {
            return;
        }

        $interns = collect([
            [
                'email' => 'feedback.temp.intern01@interntrack.com',
                'full_name' => 'Feedback Temp Intern 01',
                'ojt_id' => 3101,
                'ojt_role' => 'Frontend Developer',
            ],
            [
                'email' => 'feedback.temp.intern02@interntrack.com',
                'full_name' => 'Feedback Temp Intern 02',
                'ojt_id' => 3102,
                'ojt_role' => 'Backend Developer',
            ],
            [
                'email' => 'feedback.temp.intern03@interntrack.com',
                'full_name' => 'Feedback Temp Intern 03',
                'ojt_id' => 3103,
                'ojt_role' => 'QA Analyst',
            ],
        ])->map(function (array $internData) use ($supervisor) {
            return User::updateOrCreate(
                ['email' => $internData['email']],
                [
                    'full_name' => $internData['full_name'],
                    'password' => 'password123',
                    'role' => 'intern',
                    'status' => 'active',
                    'email_verified_at' => Carbon::now(),
                    'avatar_url' => sprintf(
                        'https://ui-avatars.com/api/?name=%s&background=random',
                        str_replace(' ', '+', $internData['full_name'])
                    ),
                    'ojt_id' => $internData['ojt_id'],
                    'ojt_role' => $internData['ojt_role'],
                    'required_hours' => 500,
                    'ojt_type' => 'required',
                    'start_date' => Carbon::now()->subDays(20),
                    'supervisor_id' => $supervisor->id,
                    'department' => 'IT Department',
                ]
            );
        })->values();

        $tasks = [
            [
                'title' => 'Temp Feedback Task 01 - Submitted Mix',
                'description' => 'Temporary seeded task for supervisor feedback page verification with mixed submitted and pending entries.',
                'days_ago' => 2,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [0],
            ],
            [
                'title' => 'Temp Feedback Task 02 - All Pending',
                'description' => 'Temporary seeded task for verifying pending filter behavior on the supervisor feedback page.',
                'days_ago' => 3,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [],
            ],
            [
                'title' => 'Temp Feedback Task 03 - All Submitted',
                'description' => 'Temporary seeded task for verifying submitted filter behavior on the supervisor feedback page.',
                'days_ago' => 4,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [0, 1, 2],
            ],
            [
                'title' => 'Temp Feedback Task 04 - Majority Submitted',
                'description' => 'Temporary seeded task with more submitted than pending feedback entries for pagination checks.',
                'days_ago' => 5,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [0, 2],
            ],
            [
                'title' => 'Temp Feedback Task 05 - Single Pending',
                'description' => 'Temporary seeded task that leaves one intern pending to exercise mixed filter results.',
                'days_ago' => 6,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [0, 1],
            ],
            [
                'title' => 'Temp Feedback Task 06 - Pending Mix',
                'description' => 'Temporary seeded task with mostly pending feedback entries for the pending view.',
                'days_ago' => 7,
                'intern_indexes' => [0, 1, 2],
                'submitted_indexes' => [1],
            ],
        ];

        foreach ($tasks as $taskIndex => $taskData) {
            $completedAt = Carbon::now()->subDays($taskData['days_ago'])->setTime(17, 0);

            $task = Task::updateOrCreate(
                ['title' => $taskData['title']],
                [
                    'description' => $taskData['description'],
                    'due_date' => $completedAt->copy()->subDays(2),
                    'priority' => $taskIndex % 2 === 0 ? 'high' : 'medium',
                    'status' => 'completed',
                    'tech_stack_categories' => ['React', 'Laravel'],
                    'tools' => ['Git', 'Postman'],
                    'approved_by' => $supervisor->id,
                    'approved_at' => $completedAt->copy()->subDay(),
                    'created_by' => $admin->id,
                ]
            );

            $task->forceFill([
                'created_at' => $completedAt->copy()->subDays(5),
                'updated_at' => $completedAt,
            ])->saveQuietly();

            $assignedInternIds = collect($taskData['intern_indexes'])
                ->map(fn (int $index) => $interns[$index]->id)
                ->all();

            $task->assignedInterns()->sync($assignedInternIds);

            foreach ($assignedInternIds as $internId) {
                $task->assignedInterns()->updateExistingPivot($internId, [
                    'intern_status' => 'completed',
                ]);
            }

            TaskFeedback::where('task_id', $task->id)
                ->whereNotIn('intern_id', $assignedInternIds)
                ->delete();

            foreach ($taskData['intern_indexes'] as $offset => $internIndex) {
                $intern = $interns[$internIndex];
                $shouldSeedFeedback = in_array($offset, $taskData['submitted_indexes'], true);

                if (!$shouldSeedFeedback) {
                    TaskFeedback::where('task_id', $task->id)
                        ->where('intern_id', $intern->id)
                        ->delete();
                    continue;
                }

                TaskFeedback::updateOrCreate(
                    [
                        'task_id' => $task->id,
                        'intern_id' => $intern->id,
                    ],
                    [
                        'supervisor_id' => $supervisor->id,
                        'competency_ratings' => [
                            [
                                'competency' => 'Technical Skills',
                                'rating' => 4 + (($taskIndex + $offset) % 2),
                                'comment' => 'Temporary seeded feedback for UI verification.',
                            ],
                            [
                                'competency' => 'Communication',
                                'rating' => 4,
                                'comment' => 'Communicated progress clearly during implementation.',
                            ],
                            [
                                'competency' => 'Teamwork',
                                'rating' => 5,
                                'comment' => 'Collaborated well with the assigned team members.',
                            ],
                            [
                                'competency' => 'Timeliness',
                                'rating' => 4,
                                'comment' => 'Delivered the requested work within the expected timeline.',
                            ],
                        ],
                    ]
                );
            }
        }
    }
}
