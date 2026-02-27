<?php

namespace Database\Seeders;

use App\Models\DailyActivity;
use App\Models\InternProject;
use App\Models\InternSkill;
use App\Models\MonthlyReport;
use App\Models\ReportAchievement;
use App\Models\User;
use App\Models\WeeklyReport;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $intern = User::where('email', 'intern@interntrack.com')->first();
        $supervisor = User::where('email', 'supervisor@interntrack.com')->first();

        if (!$intern || !$supervisor) {
            return;
        }

        // Link intern to supervisor if not already linked
        if (!$intern->supervisor_id) {
            $intern->update([
                'supervisor_id' => $supervisor->id,
                'department' => 'Information Technology',
            ]);
        }

        // ── Weekly Report ────────────────────────────────────────────────
        $weeklyReport = WeeklyReport::firstOrCreate(
            [
                'intern_id'  => $intern->id,
                'week_start' => Carbon::parse('2026-02-02'),
            ],
            [
                'week_end'    => Carbon::parse('2026-02-06'),
                'total_hours' => 38,
                'total_tasks' => 15,
                'challenges'  => 'Learning to optimize complex database queries',
            ]
        );

        // Daily Activities
        $days = [
            ['day_name' => 'Monday',    'description' => 'Code review and bug fixes for user dashboard',      'hours_worked' => 7],
            ['day_name' => 'Tuesday',   'description' => 'Feature development for mobile app',                'hours_worked' => 8],
            ['day_name' => 'Wednesday', 'description' => 'Database optimization and testing',                  'hours_worked' => 7],
            ['day_name' => 'Thursday',  'description' => 'UI/UX improvements and documentation',               'hours_worked' => 8],
            ['day_name' => 'Friday',    'description' => 'Team meeting and project planning',                  'hours_worked' => 8],
        ];

        foreach ($days as $day) {
            DailyActivity::firstOrCreate(
                [
                    'weekly_report_id' => $weeklyReport->id,
                    'day_name'         => $day['day_name'],
                ],
                [
                    'description'  => $day['description'],
                    'hours_worked' => $day['hours_worked'],
                ]
            );
        }

        // Achievements
        $achievements = [
            'Successfully deployed authentication system',
            'Improved database query performance by 40%',
            'Completed unit tests for new features',
        ];

        foreach ($achievements as $achievement) {
            ReportAchievement::firstOrCreate([
                'weekly_report_id' => $weeklyReport->id,
                'description'      => $achievement,
            ]);
        }

        // ── Monthly Report ───────────────────────────────────────────────
        $monthlyReport = MonthlyReport::firstOrCreate(
            [
                'intern_id' => $intern->id,
                'month'     => 1,
                'year'      => 2026,
            ],
            [
                'total_hours'           => 160,
                'tasks_completed'       => 48,
                'attendance_percentage' => 92,
                'projects_count'        => 3,
                'overview'              => 'Completed major project milestones including authentication system implementation and database optimization. Strong progress in full-stack development skills.',
                'supervisor_id'         => $supervisor->id,
                'rating'                => 4,
                'feedback_comment'      => 'Excellent progress and strong technical skills. Shows great initiative in problem-solving and team collaboration. Keep up the outstanding work.',
            ]
        );

        // Skills
        $skills = [
            ['skill_name' => 'React and Typescript', 'proficiency' => 85],
            ['skill_name' => 'Node.js',              'proficiency' => 70],
            ['skill_name' => 'Database Management',  'proficiency' => 85],
            ['skill_name' => 'API Integration',      'proficiency' => 65],
        ];

        foreach ($skills as $skill) {
            InternSkill::firstOrCreate([
                'monthly_report_id' => $monthlyReport->id,
                'skill_name'        => $skill['skill_name'],
            ], [
                'proficiency' => $skill['proficiency'],
            ]);
        }

        // Projects
        $projects = [
            [
                'title'       => 'User Authentication System',
                'description' => 'Designed and implemented secure authentication with JWT tokens',
                'role'        => 'Lead Developer',
                'status'      => 'completed',
            ],
            [
                'title'       => 'Dashboard Analytics',
                'description' => 'Building interactive data visualization components',
                'role'        => 'Frontend Developer',
                'status'      => 'completed',
            ],
            [
                'title'       => 'API Optimization',
                'description' => 'Improved API response time by 40%',
                'role'        => 'Backend Developer',
                'status'      => 'completed',
            ],
        ];

        foreach ($projects as $project) {
            InternProject::firstOrCreate([
                'monthly_report_id' => $monthlyReport->id,
                'title'             => $project['title'],
            ], [
                'description' => $project['description'],
                'role'        => $project['role'],
                'status'      => $project['status'],
            ]);
        }
    }
}
