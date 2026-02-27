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
        $admin = User::firstOrCreate(
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
        $supervisor = User::firstOrCreate(
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

        // 3. Create a Dummy Intern User (linked to supervisor)
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
                'supervisor_id' => $supervisor->id,
            ]
        );

        // Update supervisor_id if intern already existed without it
        if (!$intern->supervisor_id) {
            $intern->update(['supervisor_id' => $supervisor->id]);
        }

        // 4. Create sample tasks with pending_approval status for supervisor testing
        $task1 = Task::firstOrCreate(
            ['title' => 'Build Login Page UI'],
            [
                'description' => 'Create the login page with email and password fields, form validation, and responsive design.',
                'due_date' => Carbon::now()->addDays(7),
                'priority' => 'high',
                'status' => 'pending_approval',
                'created_by' => $admin->id,
            ]
        );
        $task1->assignedInterns()->syncWithoutDetaching([$intern->id]);

        $task2 = Task::firstOrCreate(
            ['title' => 'Write API Documentation'],
            [
                'description' => 'Document all REST API endpoints with request/response examples using Postman or Swagger.',
                'due_date' => Carbon::now()->addDays(14),
                'priority' => 'medium',
                'status' => 'pending_approval',
                'created_by' => $admin->id,
            ]
        );
        $task2->assignedInterns()->syncWithoutDetaching([$intern->id]);

        $task3 = Task::firstOrCreate(
            ['title' => 'Setup Unit Tests'],
            [
                'description' => 'Set up PHPUnit test suite and write initial tests for authentication endpoints.',
                'due_date' => Carbon::now()->addDays(10),
                'priority' => 'low',
                'status' => 'pending_approval',
                'created_by' => $admin->id,
            ]
        );
        $task3->assignedInterns()->syncWithoutDetaching([$intern->id]);
    }
}
