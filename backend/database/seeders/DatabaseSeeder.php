<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // We do NOT use WithoutModelEvents here so that the UserObserver 
        // will automatically create the user_settings for newly seeded users!

        // 1. Create an Admin User
        User::firstOrCreate(
            ['email' => 'admin@interntrack.com'],
            [
                'full_name' => 'System Administrator',
                'password' => 'password123', // Automatically hashed by the model casts, but using Hash::make for safety just in case
                'role' => 'admin',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'avatar_url' => 'https://ui-avatars.com/api/?name=System+Admin&background=random',
                'ojt_id' => 1000,
            ]
        );

        // 2. Create a Supervisor User
        User::firstOrCreate(
            ['email' => 'supervisor@interntrack.com'],
            [
                'full_name' => 'IT Department Supervisor',
                'password' => 'password123',
                'role' => 'supervisor',
                'status' => 'active',
                'department' => 'IT Department',
                'email_verified_at' => Carbon::now(),
                'avatar_url' => 'https://ui-avatars.com/api/?name=IT+Supervisor&background=random',
                'ojt_id' => 1001,
            ]
        );

        // 3. Create a Dummy Intern User
        $intern = User::firstOrCreate(
            ['email' => 'intern@interntrack.com'],
            [
                'full_name' => 'Test Intern User',
                'password' => 'password123',
                'role' => 'intern',
                'status' => 'active',
                'email_verified_at' => Carbon::now(),
                'avatar_url' => 'https://ui-avatars.com/api/?name=Test+Intern&background=random',
                'ojt_id' => 1102,
                'ojt_role' => 'Frontend Developer',
                'required_hours' => 500,
                'ojt_type' => 'required',
                'start_date' => Carbon::now()->subDays(10),
            ]
        );

        // 4. Create Sample Tasks for the Intern
        $admin = User::where('email', 'admin@interntrack.com')->first();

        Task::firstOrCreate(
            ['title' => 'Setup Development Environment'],
            [
                'description' => 'Install and configure all required tools: Node.js, PHP, Composer, XAMPP, and VS Code extensions.',
                'assigned_to' => $intern->id,
                'created_by' => $admin->id,
                'status' => 'todo',
                'priority' => 'high',
                'due_date' => Carbon::now()->addDays(3),
            ]
        );

        Task::firstOrCreate(
            ['title' => 'Create Login Page Wireframe'],
            [
                'description' => 'Design a wireframe for the login page following the InternTrack UI guidelines.',
                'assigned_to' => $intern->id,
                'created_by' => $admin->id,
                'status' => 'in_progress',
                'priority' => 'medium',
                'due_date' => Carbon::now()->addDays(5),
            ]
        );

        Task::firstOrCreate(
            ['title' => 'Write API Documentation'],
            [
                'description' => 'Document all existing API endpoints including request/response formats.',
                'assigned_to' => $intern->id,
                'created_by' => $admin->id,
                'status' => 'completed',
                'priority' => 'low',
                'due_date' => Carbon::now()->subDays(2),
            ]
        );

        Task::firstOrCreate(
            ['title' => 'Fix Sidebar Navigation Bug'],
            [
                'description' => 'The sidebar collapses unexpectedly on smaller screens. Investigate and fix.',
                'assigned_to' => $intern->id,
                'created_by' => $admin->id,
                'status' => 'todo',
                'priority' => 'high',
                'due_date' => Carbon::now()->subDays(1),
            ]
        );

        Task::firstOrCreate(
            ['title' => 'Review Component Library'],
            [
                'description' => 'Review the existing component library and suggest improvements for reusability.',
                'assigned_to' => $intern->id,
                'created_by' => $admin->id,
                'status' => 'pending_completion_review',
                'priority' => 'medium',
                'due_date' => Carbon::now()->addDays(1),
            ]
        );
    }
}
