<?php

namespace Database\Seeders;

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
        User::firstOrCreate(
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
    }
}
