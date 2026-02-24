# InternTrack

A comprehensive internship management and tracking system built with a split
**React + TypeScript + Vite** frontend and **Laravel 11** backend API.

## Overview

InternTrack is a role-based web application designed to streamline internship
program management. It provides separate dashboards and features for students,
supervisors, and administrators to track progress, manage tasks, monitor
attendance, and evaluate performance.

_Note: InternTrack recently migrated its core architecture from Supabase to a
custom, robust Laravel 11 backend for better extensibility._

## Features

### Intern (Student) Features

- **Dashboard**: Overview of internship progress and announcements
- **Daily Logs**: Record daily activities and reflections
- **Schedule**: View assigned tasks and timeline
- **Announcements**: Stay informed about program updates
- **Reports**: Track performance metrics and progress
- **Settings**: Manage personal profile and preferences

### Supervisor Features

- **Dashboard**: Manage assigned interns and monitor progress
- **Manage Interns**: View and organize intern information
- **Manage Tasks**: Assign and track task completion
- **Monitor Attendance**: Monitor intern attendance and engagement
- **Approvals**: Review and approve intern submissions
- **Evaluations**: Conduct performance evaluations
- **Feedback**: Provide constructive feedback to interns
- **Performance**: Review performance metrics and analytics
- **Reports**: Generate comprehensive reports
- **Announcements**: Communicate with interns

### Admin Features

- **Dashboard**: System overview and management
- **Manage Interns**: Administer all interns in the system
- **Manage Tasks**: Create and manage global tasks
- **Monitor Attendance**: System-wide attendance tracking
- **Announcements**: Broadcast announcements to all users
- **Reports**: Generate system-wide reports
- **Settings**: Configure system settings and policies

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Backend/API**: Laravel 11 (PHP 8.2+)
- **Database**: MySQL (via XAMPP, Valet, or similar)
- **Authentication**: Laravel Sanctum Token Authentication
- **Styling**: Tailwind CSS

## Project Structure

```
InternTrack/
├── backend/            # Laravel 11 Application (API & Database)
│   ├── app/            # Controllers, Models, Middleware
│   ├── config/         # Sanctum and CORS configuration
│   ├── database/       # Migrations and Seeders
│   └── routes/         # API Routes (api.php)
├── src/                # React Frontend Source Code
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (AuthContext)
│   ├── pages/          # Page views (Admin, Public, Student, Supervisor)
│   ├── services/       # API Services (Axios wrappers for Laravel endpoints)
│   ├── styles/         # Scoped and global styling
│   └── types/          # TypeScript interface definitions
└── Laravel Backend Setup.md  # Detailed setup guide!
```

## Getting Started

### Prerequisites

- PHP >= 8.2
- Composer
- Node.js >= 16 and npm
- XAMPP/MySQL running locally

### Detailed Setup Instructions

For a comprehensive step-by-step guide on setting up the Database, the Laravel
Backend, and connecting the React Frontend, please read the included
**[Laravel Backend Setup.md](./Laravel%20Backend%20Setup.md)** file.

---

### Quick Start Summary

_Assuming database is created and ready..._

**1. Start the Backend:**

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Check your .env for MySQL connection, then:
php artisan migrate:fresh --seed
php artisan serve
```

**2. Start the Frontend:** Open a new terminal:

```bash
npm install
# Ensure root .env has VITE_API_URL=http://localhost:8000/api
npm run dev
```

**3. Test Accounts (Password: `password123`):**

- `admin@interntrack.com`
- `supervisor@interntrack.com`
- `intern@interntrack.com`
