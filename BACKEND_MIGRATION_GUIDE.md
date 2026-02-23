# InternTrack — Backend Migration Guide

## Supabase → Laravel + MySQL/SQL

**Document Version:** 1.0  
**Date:** February 23, 2026  
**Purpose:** Comprehensive backend documentation for incoming backend developers migrating from Supabase (PostgreSQL + Auth + Realtime + Edge Functions) to Laravel (PHP) with MySQL/SQL.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Database Schema](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Authorization & Row-Level Security (RLS)](#5-authorization--row-level-security-rls)
6. [API Endpoints to Build](#6-api-endpoints-to-build)
7. [Service Layer — Full API Contract](#7-service-layer--full-api-contract)
8. [Edge Functions](#8-edge-functions)
9. [Realtime Features](#9-realtime-features)
10. [Database Functions (RPCs)](#10-database-functions-rpcs)
11. [Database Triggers](#11-database-triggers)
12. [Email Templates](#12-email-templates)
13. [Validation Rules](#13-validation-rules)
14. [Frontend Integration Points](#14-frontend-integration-points)
15. [Environment Variables](#15-environment-variables)
16. [Laravel Migration Checklist](#16-laravel-migration-checklist)
17. [Recommended Laravel Stack](#17-recommended-laravel-stack)

---

## 1. Project Overview

**InternTrack** is an internship/OJT (On-the-Job Training) management system with three user roles:

| Role | Description |
|------|------------|
| **Admin** | Full system control — manage interns, supervisors, other admins, tasks, announcements, attendance |
| **Supervisor** | Manage assigned interns, create evaluations, view tasks and attendance |
| **Intern** | View assigned tasks, clock in/out attendance, view announcements and evaluations |

### Tech Stack (Current)
- **Frontend:** React 19 + TypeScript + Vite + React Router 7
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Validation:** Zod
- **Deployment:** Vercel (frontend SPA with catch-all rewrite)
- **Charts:** Chart.js, Recharts

### Tech Stack (Target)
- **Frontend:** Same (React 19 + TypeScript) — only the service layer changes
- **Backend:** Laravel (PHP) + MySQL/SQL
- **Auth:** Laravel Sanctum or Passport (replacing Supabase Auth)
- **Realtime:** Laravel Broadcasting with Pusher/Soketi/Reverb (replacing Supabase Realtime)

---

## 2. Architecture Summary

### Current Architecture (Supabase)

```
┌──────────────────────────────────┐
│         React Frontend           │
│  (Vite + TypeScript + React 19)  │
└────────────┬─────────────────────┘
             │
    ┌────────▼─────────┐
    │   Service Layer   │  ← src/services/*.ts
    │  (Supabase SDK)   │
    └────────┬─────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │              Supabase Backend                 │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
    │  │   Auth   │ │ Database │ │   Realtime   │  │
    │  │ (GoTrue) │ │ (Postgres)│ │ (WebSocket)  │  │
    │  └──────────┘ └──────────┘ └──────────────┘  │
    │  ┌──────────────────┐                        │
    │  │  Edge Functions   │                       │
    │  │ (Deno Runtime)    │                       │
    │  └──────────────────┘                        │
    └──────────────────────────────────────────────┘
```

### Target Architecture (Laravel)

```
┌──────────────────────────────────┐
│         React Frontend           │
│  (Vite + TypeScript + React 19)  │
└────────────┬─────────────────────┘
             │  HTTP/REST API + WebSocket
    ┌────────▼─────────┐
    │  Service Layer    │  ← Rewritten to use fetch/axios
    │  (REST Client)    │
    └────────┬─────────┘
             │
    ┌────────▼─────────────────────────────────────┐
    │              Laravel Backend                  │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
    │  │ Sanctum  │ │  MySQL   │ │ Broadcasting │  │
    │  │  (Auth)  │ │ Database │ │(Pusher/Reverb)│  │
    │  └──────────┘ └──────────┘ └──────────────┘  │
    │  ┌──────────────────┐ ┌───────────────────┐  │
    │  │   Controllers     │ │    Middleware      │  │
    │  │  (REST API)       │ │ (Role-based Auth) │  │
    │  └──────────────────┘ └───────────────────┘  │
    └──────────────────────────────────────────────┘
```

### Key Differences

| Feature | Supabase | Laravel Equivalent |
|---------|----------|--------------------|
| Authentication | Supabase Auth (GoTrue) — JWT-based | Laravel Sanctum (API tokens) or Passport (OAuth2) |
| Authorization (RLS) | PostgreSQL Row-Level Security policies | Laravel Policies + Gates + Middleware |
| Database queries | Supabase JS SDK (`supabase.from().select()`) | Eloquent ORM or REST API endpoints |
| Realtime | Supabase Realtime (PostgreSQL CDC via WebSocket) | Laravel Broadcasting (Pusher/Reverb/Soketi) |
| Edge Functions | Deno-based serverless functions | Laravel Controllers / API routes |
| RPC Functions | PostgreSQL functions called via `supabase.rpc()` | Laravel Controller methods or Service classes |
| File Storage | Supabase Storage (NOT USED in this project) | Laravel Storage (NOT NEEDED) |
| Email | Supabase GoTrue built-in email | Laravel Mail (Mailgun, SES, SMTP, etc.) |

---

## 3. Database Schema

### 3.1 Complete Table Definitions

Below is every table in the system. Each is annotated with its MySQL equivalent.

---

#### Table: `users`

The central user profile table. Extends the auth system's user identity.

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints | Notes |
|--------|----------------------|------------------|------------|-------|
| `id` | `UUID PRIMARY KEY` | `CHAR(36) PRIMARY KEY` or `BIGINT UNSIGNED AUTO_INCREMENT` | FK → `auth.users(id)` ON DELETE CASCADE | In Laravel, use `$table->id()` (bigint) or `$table->uuid('id')->primary()` |
| `email` | `TEXT UNIQUE NOT NULL` | `VARCHAR(255) UNIQUE NOT NULL` | | |
| `full_name` | `TEXT` | `VARCHAR(255) NULL` | | |
| `avatar_url` | `TEXT` | `VARCHAR(500) NULL` | | Auto-generated via ui-avatars.com on signup |
| `role` | `TEXT NOT NULL DEFAULT 'intern'` | `ENUM('admin','supervisor','intern') NOT NULL DEFAULT 'intern'` | CHECK constraint | |
| `ojt_role` | `TEXT` | `VARCHAR(255) NULL` | | Position title, e.g., "Frontend Developer" |
| `ojt_id` | `INTEGER UNIQUE` | `INT UNSIGNED UNIQUE` | Auto-generated via sequence starting at 1101 | Sequential intern identifier |
| `start_date` | `DATE` | `DATE NULL` | | Internship start date |
| `required_hours` | `INTEGER` | `INT UNSIGNED NULL` | | Total required internship hours |
| `ojt_type` | `TEXT DEFAULT 'required'` | `ENUM('required','voluntary') DEFAULT 'required'` | CHECK constraint | |
| `status` | `TEXT NOT NULL DEFAULT 'active'` | `ENUM('active','archived') NOT NULL DEFAULT 'active'` | CHECK constraint | |
| `supervisor_id` | `UUID` | `CHAR(36) NULL` or `BIGINT UNSIGNED NULL` | FK → `users(id)` ON DELETE SET NULL | Links intern to supervisor |
| `department` | `TEXT` | `VARCHAR(255) NULL` | | |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | | |

**Laravel Migration:**
```php
Schema::create('users', function (Blueprint $table) {
    $table->id(); // or $table->uuid('id')->primary();
    $table->string('email')->unique();
    $table->string('password'); // Added for Laravel auth
    $table->string('full_name')->nullable();
    $table->string('avatar_url', 500)->nullable();
    $table->enum('role', ['admin', 'supervisor', 'intern'])->default('intern');
    $table->string('ojt_role')->nullable();
    $table->unsignedInteger('ojt_id')->unique()->nullable();
    $table->date('start_date')->nullable();
    $table->unsignedInteger('required_hours')->nullable();
    $table->enum('ojt_type', ['required', 'voluntary'])->default('required');
    $table->enum('status', ['active', 'archived'])->default('active');
    $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('department')->nullable();
    $table->timestamp('email_verified_at')->nullable(); // Laravel convention
    $table->rememberToken(); // Laravel convention
    $table->timestamps(); // created_at + updated_at
});
```

**Index:**
```php
$table->index('supervisor_id');
$table->index('role');
$table->index('status');
```

---

#### Table: `tasks`

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints |
|--------|----------------------|------------------|------------|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `CHAR(36) PRIMARY KEY` or `BIGINT UNSIGNED AUTO_INCREMENT` | |
| `title` | `TEXT NOT NULL` | `VARCHAR(255) NOT NULL` | |
| `description` | `TEXT` | `TEXT NULL` | |
| `assigned_to` | `UUID` | FK → `users(id)` | ON DELETE SET NULL |
| `status` | `TEXT NOT NULL DEFAULT 'todo'` | `ENUM('todo','in-progress','review','done') NOT NULL DEFAULT 'todo'` | |
| `priority` | `TEXT NOT NULL DEFAULT 'medium'` | `ENUM('low','medium','high') NOT NULL DEFAULT 'medium'` | |
| `due_date` | `TIMESTAMPTZ` | `TIMESTAMP NULL` | |
| `created_by` | `UUID` | FK → `users(id)` | ON DELETE SET NULL |
| `reviewed_by` | `UUID` | FK → `users(id)` | ON DELETE SET NULL |
| `reviewed_at` | `TIMESTAMPTZ` | `TIMESTAMP NULL` | |
| `review_comments` | `TEXT` | `TEXT NULL` | |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | |

**Laravel Migration:**
```php
Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('description')->nullable();
    $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->enum('status', ['todo', 'in-progress', 'review', 'done'])->default('todo');
    $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
    $table->timestamp('due_date')->nullable();
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('reviewed_at')->nullable();
    $table->text('review_comments')->nullable();
    $table->timestamps();
});
```

---

#### Table: `attendance`

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints |
|--------|----------------------|------------------|------------|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| `user_id` | `UUID NOT NULL` | FK → `users(id)` | ON DELETE CASCADE |
| `date` | `DATE NOT NULL DEFAULT CURRENT_DATE` | `DATE NOT NULL DEFAULT (CURDATE())` | |
| `time_in` | `TIMESTAMPTZ` | `TIMESTAMP NULL` | |
| `time_out` | `TIMESTAMPTZ` | `TIMESTAMP NULL` | |
| `total_hours` | `FLOAT` | `DECIMAL(5,2) NULL` | |
| `status` | `TEXT NOT NULL DEFAULT 'present'` | `ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present'` | |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | |

**Unique Constraint:** `UNIQUE(user_id, date)` — prevents duplicate attendance per user per day.

**Laravel Migration:**
```php
Schema::create('attendance', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->date('date')->default(DB::raw('(CURDATE())'));
    $table->timestamp('time_in')->nullable();
    $table->timestamp('time_out')->nullable();
    $table->decimal('total_hours', 5, 2)->nullable();
    $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
    $table->timestamps();

    $table->unique(['user_id', 'date']);
});
```

---

#### Table: `announcements`

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints |
|--------|----------------------|------------------|------------|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| `title` | `TEXT NOT NULL` | `VARCHAR(255) NOT NULL` | |
| `content` | `TEXT NOT NULL` | `TEXT NOT NULL` | |
| `priority` | `TEXT NOT NULL DEFAULT 'medium'` | `ENUM('low','medium','high') NOT NULL DEFAULT 'medium'` | |
| `created_by` | `UUID` | FK → `users(id)` | ON DELETE SET NULL |
| `visibility` | `TEXT NOT NULL DEFAULT 'all'` | `ENUM('all','admin','supervisor','intern') NOT NULL DEFAULT 'all'` | |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | |

**Laravel Migration:**
```php
Schema::create('announcements', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
    $table->enum('visibility', ['all', 'admin', 'supervisor', 'intern'])->default('all');
    $table->timestamps();
});
```

---

#### Table: `evaluations`

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints |
|--------|----------------------|------------------|------------|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | `BIGINT UNSIGNED AUTO_INCREMENT` | |
| `intern_id` | `UUID NOT NULL` | FK → `users(id)` | ON DELETE CASCADE |
| `supervisor_id` | `UUID NOT NULL` | FK → `users(id)` | ON DELETE CASCADE |
| `score` | `INTEGER` | `TINYINT UNSIGNED` | CHECK: 1–100 (code validates 1–10) |
| `feedback` | `TEXT` | `TEXT NULL` | |
| `evaluation_date` | `DATE DEFAULT CURRENT_DATE` | `DATE DEFAULT (CURDATE())` | |
| `term` | `TEXT` | `VARCHAR(50) NULL` | e.g., 'Midterm', 'Final', 'Monthly' |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | |

**Laravel Migration:**
```php
Schema::create('evaluations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('intern_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
    $table->unsignedTinyInteger('score')->nullable(); // 1-10 range
    $table->text('feedback')->nullable();
    $table->date('evaluation_date')->default(DB::raw('(CURDATE())'));
    $table->string('term', 50)->nullable(); // Midterm, Final, Monthly
    $table->timestamps();
});
```

---

#### Table: `user_settings`

| Column | Supabase (PostgreSQL) | MySQL Equivalent | Constraints |
|--------|----------------------|------------------|------------|
| `user_id` | `UUID PRIMARY KEY` | FK → `users(id)` | ON DELETE CASCADE |
| `theme` | `TEXT NOT NULL DEFAULT 'light'` | `ENUM('light','dark','system') NOT NULL DEFAULT 'light'` | |
| `notifications_enabled` | `BOOLEAN DEFAULT true` | `BOOLEAN DEFAULT TRUE` | |
| `email_updates` | `BOOLEAN DEFAULT true` | `BOOLEAN DEFAULT TRUE` | |
| `dashboard_layout` | `TEXT DEFAULT 'default'` | `VARCHAR(50) DEFAULT 'default'` | |
| `updated_at` | `TIMESTAMPTZ DEFAULT now()` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Laravel Migration:**
```php
Schema::create('user_settings', function (Blueprint $table) {
    $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
    $table->enum('theme', ['light', 'dark', 'system'])->default('light');
    $table->boolean('notifications_enabled')->default(true);
    $table->boolean('email_updates')->default(true);
    $table->string('dashboard_layout', 50)->default('default');
    $table->timestamps();
});
```

---

### 3.2 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐
│    users     │       │ user_settings│
│──────────────│       │──────────────│
│ id (PK)      │◄──────│ user_id (PK) │ FK
│ email        │       │ theme        │
│ full_name    │       │ notifications│
│ role         │       │ email_updates│
│ status       │       │ layout       │
│ supervisor_id│──┐    └──────────────┘
│ department   │  │
│ ojt_role     │  │    self-reference
│ ojt_id       │  └──► users.id
│ ...          │
└──────┬───────┘
       │
       │ Referenced by:
       │
  ┌────┴──────────────────────────────────────┐
  │              │              │              │
  ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
│  tasks   │  │attendance│  │announcements │  │ evaluations  │
│──────────│  │──────────│  │──────────────│  │──────────────│
│ id (PK)  │  │ id (PK)  │  │ id (PK)      │  │ id (PK)      │
│ title    │  │ user_id  │──┤ title        │  │ intern_id    │──► users.id
│ assigned │──┤ date     │  │ content      │  │ supervisor_id│──► users.id
│ _to (FK) │  │ time_in  │  │ priority     │  │ score        │
│ created  │──┤ time_out │  │ created_by   │──┤ feedback     │
│ _by (FK) │  │ total_hrs│  │ visibility   │  │ eval_date    │
│ reviewed │──┤ status   │  │ created_at   │  │ term         │
│ _by (FK) │  │ UNIQUE   │  └──────────────┘  │ created_at   │
│ status   │  │(user,date)│                    └──────────────┘
│ priority │  └──────────┘
│ due_date │
└──────────┘
```

---

## 4. Authentication System

### 4.1 Current Supabase Auth Flow

Supabase uses **GoTrue** — a JWT-based auth service. The frontend talks directly to it.

#### Sign Up Flow
1. Frontend calls `supabase.auth.signUp({ email, password, options: { data: metadata } })`
2. Supabase creates entry in `auth.users` table
3. Database trigger `on_auth_user_created` fires → inserts row into `public.users` with metadata
4. If email confirmation is enabled, user receives verification email
5. User clicks link → email verified → session established

#### Sign In Flow
1. Frontend calls `supabase.auth.signInWithPassword({ email, password })`
2. Supabase returns JWT access token + refresh token
3. Frontend fetches user profile from `public.users` table using the user's UUID
4. Profile includes `role` which determines dashboard routing
5. If `status === 'archived'`, user is immediately signed out

#### Password Recovery Flow
1. Frontend calls RPC `check_email_exists(email)` to verify email is registered
2. Frontend calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. User receives email with reset link
4. User clicks link → redirected to `/reset-password` with recovery token
5. Frontend calls `supabase.auth.updateUser({ password: newPassword })`

#### Session Management
- JWT auto-refresh via Supabase SDK
- Session persisted in localStorage
- `onAuthStateChange` listener handles: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `PASSWORD_RECOVERY`, `INITIAL_SESSION`
- 5-minute polling fallback checks if user was archived

### 4.2 Laravel Auth Equivalent

**Recommended: Laravel Sanctum (SPA Authentication)**

```php
// 1. Sign Up → POST /api/auth/register
// 2. Sign In → POST /api/auth/login
// 3. Sign Out → POST /api/auth/logout
// 4. Get Session → GET /api/auth/user
// 5. Password Reset → POST /api/auth/forgot-password
// 6. Update Password → POST /api/auth/reset-password
// 7. Email Verification → GET /api/auth/verify-email/{id}/{hash}
// 8. Resend Verification → POST /api/auth/resend-verification
```

**User Registration Metadata:**  
On signup, the frontend currently sends this metadata (these must become regular form fields):

```json
{
    "full_name": "string (required)",
    "role": "admin | supervisor | intern (default: intern)",
    "avatar_url": "string (auto-generated if empty)",
    "ojt_role": "string (optional)",
    "start_date": "ISO date string (optional)",
    "required_hours": "integer (optional)",
    "ojt_type": "required | voluntary (default: required)"
}
```

**Important Auth Behaviors to Replicate:**
1. **Auto-generate avatar URL** on signup: `https://ui-avatars.com/api/?name={name}&background=random`
2. **Auto-generate `ojt_id`** starting from 1101 (sequential)
3. **Auto-create `user_settings`** row when user is created
4. **Block archived users** from logging in (check `status === 'archived'` on login)
5. **Duplicate email detection** — return friendly error "Email already exists"
6. **Welcome announcement** — when admin adds an intern, auto-create an announcement

---

## 5. Authorization & Row-Level Security (RLS)

Supabase enforces authorization at the database level through PostgreSQL RLS policies. In Laravel, these must be reimplemented as **middleware**, **policies**, and **controller logic**.

### 5.1 Complete RLS Policy → Laravel Policy Mapping

#### `users` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| Anyone authenticated can view all profiles | All authenticated | SELECT | `UserPolicy::viewAny()` → return `true` |
| Can update own profile | Owner | UPDATE | `UserPolicy::update()` → `$user->id === $model->id` |
| Admins can insert | Admin | INSERT | `UserPolicy::create()` → `$user->role === 'admin'` |
| Admins can update any profile | Admin | UPDATE | `UserPolicy::update()` → `$user->role === 'admin'` |
| Admins can delete | Admin | DELETE | `UserPolicy::delete()` → `$user->role === 'admin'` |

#### `tasks` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| Admins/supervisors can view all | Admin, Supervisor | SELECT | `TaskPolicy::viewAny()` → role check |
| Interns can view own tasks | Intern (owner) | SELECT | `TaskPolicy::view()` → `$task->assigned_to === $user->id` |
| Admins/supervisors can create | Admin, Supervisor | INSERT | `TaskPolicy::create()` → role check |
| Admins/supervisors can update any | Admin, Supervisor | UPDATE | `TaskPolicy::update()` → role check |
| Interns can update own tasks | Intern (owner) | UPDATE | `TaskPolicy::update()` → `$task->assigned_to === $user->id` |
| Admins can delete | Admin | DELETE | `TaskPolicy::delete()` → `$user->role === 'admin'` |

#### `attendance` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| Admins/supervisors can view all | Admin, Supervisor | SELECT | Middleware/Policy role check |
| Interns can view own | Intern (owner) | SELECT | `$attendance->user_id === $user->id` |
| Interns can clock in (own) | Intern | INSERT | `$request->user_id === $user->id` |
| Interns can update own | Intern (owner) | UPDATE | Owner check |
| Admins can insert/update/delete | Admin | ALL | Role check |

#### `announcements` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| All authenticated can view | Everyone | SELECT | Return all (public to authenticated) |
| Admins can create/update/delete | Admin | INSERT/UPDATE/DELETE | `$user->role === 'admin'` |

#### `evaluations` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| Supervisors can create (own) | Supervisor | INSERT | `$user->id === $evaluation->supervisor_id` |
| Supervisors can view/update own | Supervisor | SELECT/UPDATE | `$evaluation->supervisor_id === $user->id` |
| Interns can view own | Intern | SELECT | `$evaluation->intern_id === $user->id` |
| Admins can view/manage all | Admin | ALL | Role check |

#### `user_settings` Table

| Supabase RLS Policy | Who | Action | Laravel Equivalent |
|---------------------|-----|--------|-------------------|
| Users manage own | Owner | ALL | `$settings->user_id === $user->id` |

### 5.2 Laravel Middleware Recommendation

```php
// app/Http/Middleware/RoleMiddleware.php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Admin-only routes
});

Route::middleware(['auth:sanctum', 'role:admin,supervisor'])->group(function () {
    // Admin + Supervisor routes
});
```

---

## 6. API Endpoints to Build

Based on the frontend's service layer, here are ALL the API endpoints that the Laravel backend needs to expose.

### 6.1 Authentication Routes

| Method | Endpoint | Description | Current Supabase Call |
|--------|----------|-------------|---------------------|
| POST | `/api/auth/register` | Register new user | `supabase.auth.signUp()` |
| POST | `/api/auth/login` | Sign in | `supabase.auth.signInWithPassword()` |
| POST | `/api/auth/logout` | Sign out | `supabase.auth.signOut()` |
| GET | `/api/auth/user` | Get current session/user | `supabase.auth.getSession()` |
| POST | `/api/auth/forgot-password` | Send password reset email | `supabase.auth.resetPasswordForEmail()` |
| POST | `/api/auth/reset-password` | Update password with token | `supabase.auth.updateUser()` |
| POST | `/api/auth/resend-verification` | Resend email confirmation | `supabase.auth.resend()` |
| POST | `/api/auth/check-email` | Check if email exists | `supabase.rpc('check_email_exists')` |

### 6.2 Users / Profile Routes

| Method | Endpoint | Description | Who Can Access | Current Service Call |
|--------|----------|-------------|---------------|---------------------|
| GET | `/api/users` | Get all users | Authenticated | `userService.getUsers()` |
| GET | `/api/users/{id}` | Get user profile | Authenticated | `userService.getProfile(id)` |
| PUT | `/api/users/{id}` | Update user profile | Owner or Admin | `userService.updateUser(id, data)` |
| GET | `/api/users/interns` | List interns with filters | Admin, Supervisor | `userService.fetchInterns(filters)` |
| GET | `/api/users/interns/stats` | Intern statistics | Admin | `userService.getInternStats()` |
| PUT | `/api/users/interns/{id}` | Update intern profile | Admin | `userService.updateIntern(id, data)` |
| PUT | `/api/users/interns/{id}/archive` | Toggle archive status | Admin | `userService.toggleArchiveIntern()` |
| GET | `/api/users/interns/ojt-roles` | Get unique OJT roles | Admin | `userService.getOjtRoles()` |
| GET | `/api/users/admins` | List admins with filters | Admin | `userService.fetchAdmins(filters)` |
| GET | `/api/users/admins/stats` | Admin statistics | Admin | `userService.getAdminStats()` |
| PUT | `/api/users/admins/{id}/archive` | Toggle admin archive | Admin | `userService.toggleArchiveAdmin()` |
| GET | `/api/users/supervisors` | List supervisors with filters | Admin | `userService.fetchSupervisors(filters)` |
| GET | `/api/users/supervisors/stats` | Supervisor statistics | Admin | `userService.getSupervisorStats()` |
| PUT | `/api/users/supervisors/{id}/archive` | Toggle supervisor archive | Admin | `userService.toggleArchiveSupervisor()` |
| POST | `/api/users/upgrade-role` | Upgrade user role (intern→admin/supervisor) | Admin | Edge Function `upgrade-user-role` |
| GET | `/api/users/interns/for-upgrade` | List interns eligible for upgrade | Admin | `userService.fetchInternsForAdminUpgrade()` / `fetchInternsForSupervisorUpgrade()` |
| GET | `/api/dashboard/stats` | Dashboard statistics | Admin | `userService.getDashboardStats()` |
| GET | `/api/dashboard/recent-interns` | Recent intern registrations | Admin | `userService.getRecentInterns(limit)` |

**Query Parameters for filtered lists:**
```
GET /api/users/interns?search=john&role=frontend&status=active&sort=asc
GET /api/users/admins?search=jane&status=active&dateSort=newest
GET /api/users/supervisors?search=doe&status=active&dateSort=oldest
```

### 6.3 Tasks Routes

| Method | Endpoint | Description | Who Can Access | Current Service Call |
|--------|----------|-------------|---------------|---------------------|
| GET | `/api/tasks` | Get all tasks (filtered by role) | All authenticated | `taskService.getTasks()` |
| POST | `/api/tasks` | Create a new task | Admin, Supervisor | `taskService.createTask()` |
| PUT | `/api/tasks/{id}` | Update a task | Admin, Supervisor, or assigned Intern | (not yet in service but expected) |
| DELETE | `/api/tasks/{id}` | Delete a task | Admin | (not yet in service but expected) |

### 6.4 Attendance Routes

| Method | Endpoint | Description | Who Can Access | Current Service Call |
|--------|----------|-------------|---------------|---------------------|
| GET | `/api/attendance` | Get all attendance records | All (filtered by role) | `attendanceService.getAttendance()` |
| POST | `/api/attendance` | Create attendance record | Intern (self), Admin | `attendanceService.createAttendance()` |
| POST | `/api/attendance/clock-in` | Clock in | Intern | `attendanceService.clockIn(userId)` |
| PUT | `/api/attendance/{id}/clock-out` | Clock out | Intern (owner) | `attendanceService.clockOut(id, timeIn)` |

### 6.5 Announcements Routes

| Method | Endpoint | Description | Who Can Access | Current Service Call |
|--------|----------|-------------|---------------|---------------------|
| GET | `/api/announcements` | Get all announcements | All authenticated | `announcementService.getAnnouncements()` |
| POST | `/api/announcements` | Create announcement | Admin | `announcementService.createAnnouncement()` |
| PUT | `/api/announcements/{id}` | Update announcement | Admin | (RLS exists, not yet in service) |
| DELETE | `/api/announcements/{id}` | Delete announcement | Admin | (RLS exists, not yet in service) |

### 6.6 Evaluations Routes

| Method | Endpoint | Description | Who Can Access | Current Service Call |
|--------|----------|-------------|---------------|---------------------|
| GET | `/api/evaluations` | Get evaluations (filtered by role) | All (role-filtered) | `evaluationService.getEvaluations()` |
| POST | `/api/evaluations` | Create evaluation | Supervisor | `evaluationService.createEvaluation()` |

### 6.7 User Settings Routes

| Method | Endpoint | Description | Who Can Access |
|--------|----------|-------------|---------------|
| GET | `/api/settings` | Get current user's settings | Owner |
| PUT | `/api/settings` | Update current user's settings | Owner |

---

## 7. Service Layer — Full API Contract

This section documents every function in each service file, its exact behavior, parameters, and return types. **This is the contract the Laravel API must fulfil.**

### 7.1 `authService` (src/services/authService.ts)

| Function | Parameters | Returns | Behavior |
|----------|-----------|---------|----------|
| `signUp` | `email: string, password: string, metadata: SignUpMetadata` | `{ user, session, error }` | Creates auth user + profile via trigger. Returns error for duplicate emails (empty identities array). |
| `signIn` | `email: string, password: string` | `{ user, session, error }` | Standard email/password login. Returns JWT. |
| `signOut` | none | `{ error }` | Invalidates session. |
| `resetPassword` | `email: string` | `{ error }` | Checks email exists via RPC, then sends reset email. Sets localStorage flag. |
| `updatePassword` | `newPassword: string` | `{ error }` | Updates authenticated user's password. |
| `getSession` | none | `{ session, error }` | Returns current session/user data. |
| `getUserProfile` | `userId: string` | `{ profile, error }` | `SELECT * FROM users WHERE id = userId` |
| `onAuthStateChange` | `callback` | `unsubscribe function` | Listens for auth events (login, logout, token refresh, recovery). |
| `resendConfirmation` | `email: string` | `{ error }` | Resends signup verification email. |
| `addIntern` | `internData: InternData, adminUser` | `{ user, session, error }` | Admin-only. Calls signUp internally + creates welcome announcement. |

**`SignUpMetadata` Type:**
```typescript
{
    full_name: string;       // required
    role: UserRole;          // 'admin' | 'supervisor' | 'intern'
    avatar_url?: string;     // optional, auto-generated if empty
    ojt_role?: string;       // optional
    start_date?: string;     // ISO date string, optional
    required_hours?: number; // optional
    ojt_type?: 'required' | 'voluntary'; // optional, default 'required'
}
```

### 7.2 `userService` (src/services/userServices.ts)

| Function | Parameters | Returns | SQL Equivalent |
|----------|-----------|---------|---------------|
| `getUsers` | none | `Users[]` | `SELECT * FROM users` |
| `createUser` | `Omit<Users, 'id' \| 'created_at'>` | `Users` | `INSERT INTO users (...) RETURNING *` |
| `fetchInterns` | `{ search?, role?, status?, sortDirection? }` | `Users[]` | `SELECT * FROM users WHERE role='intern' [+ filters]` |
| `getInternStats` | none | `{ totalInterns, totalRoles, archivedInterns }` | Count interns, count distinct ojt_roles, count archived |
| `updateIntern` | `internId: string, updates: Partial<Users>` | `Users` | `UPDATE users SET ... WHERE id = internId` |
| `updateUser` | `userId: string, updates: Partial<Users>` | `Users` | `UPDATE users SET ... WHERE id = userId` |
| `toggleArchiveIntern` | `internId: string, currentStatus: string` | `Users` | Toggle `status` between 'active' and 'archived' |
| `getOjtRoles` | none | `string[]` | `SELECT DISTINCT ojt_role FROM users WHERE role='intern' AND ojt_role IS NOT NULL` |
| `getProfile` | `userId: string` | `Users` | `SELECT * FROM users WHERE id = userId` |
| `getDashboardStats` | none | `{ totalInterns, activeInterns, pendingApplications, recentRegisters }` | Calls RPC `get_intern_verification_stats` + counts recent registrations from last 3 months |
| `getRecentInterns` | `limit: number = 5` | `{ full_name, created_at, avatar_url }[]` | `SELECT full_name, created_at, avatar_url FROM users WHERE role='intern' ORDER BY created_at DESC LIMIT 5` |
| `fetchAdmins` | `{ search?, status?, dateSort? }` | `Users[]` | `SELECT * FROM users WHERE role='admin' [+ filters]` |
| `getAdminStats` | none | `{ totalAdmins, activeAdmins, archivedAdmins }` | Count admins by status |
| `toggleArchiveAdmin` | `adminId, currentStatus` | `Users` | Toggle status |
| `fetchInternsForAdminUpgrade` | none | `Users[]` | `SELECT * FROM users WHERE role='intern' AND status='active' ORDER BY full_name` |
| `upgradeInternToAdmin` | `userId: string` | `Users` | Updates role to 'admin' in users table AND auth metadata (via Edge Function) |
| `fetchSupervisors` | `{ search?, status?, dateSort? }` | `Users[]` | `SELECT * FROM users WHERE role='supervisor' [+ filters]` |
| `getSupervisorStats` | none | `{ totalSupervisors, activeSupervisors, archivedSupervisors }` | Count supervisors by status |
| `toggleArchiveSupervisor` | `supervisorId, currentStatus` | `Users` | Toggle status |
| `fetchInternsForSupervisorUpgrade` | none | `Users[]` | Same as admin upgrade list |
| `upgradeInternToSupervisor` | `userId: string` | `Users` | Updates role to 'supervisor' via Edge Function |

**Filter Logic for `fetchInterns`:**
```sql
-- Base query
SELECT * FROM users WHERE role = 'intern'

-- If status filter (not 'all'):
AND status = :status

-- If role filter (not 'all'):
AND ojt_role = :role

-- If search term:
AND (
    full_name ILIKE '%search%'
    OR email ILIKE '%search%'
    OR ojt_role ILIKE '%search%'
    OR ojt_id = :numericSearch  -- only if search is a valid number
)

-- Sort:
ORDER BY full_name ASC|DESC
```

**Filter Logic for `fetchAdmins` / `fetchSupervisors`:**
```sql
SELECT * FROM users WHERE role = 'admin'|'supervisor'
AND status = :status  -- if not 'all'
AND (full_name ILIKE '%search%' OR email ILIKE '%search%')
ORDER BY created_at ASC|DESC
```

### 7.3 `taskService` (src/services/taskServices.ts)

| Function | Parameters | Returns | SQL Equivalent |
|----------|-----------|---------|---------------|
| `getTasks` | none | `Tasks[]` | `SELECT * FROM tasks` (RLS filters by role) |
| `createTask` | `Omit<Tasks, 'id' \| 'created_at'>` | `Tasks` | `INSERT INTO tasks (...) RETURNING *` |

**Note:** Interns should only see tasks assigned to them. Admins/supervisors see all. This filtering is done by RLS in Supabase and must be done in the Laravel controller.

### 7.4 `attendanceService` (src/services/attendanceServices.ts)

| Function | Parameters | Returns | SQL Equivalent |
|----------|-----------|---------|---------------|
| `getAttendance` | none | `Attendance[]` | `SELECT * FROM attendance` (RLS filtered) |
| `createAttendance` | `Omit<Attendance, 'id' \| 'created_at'>` | `Attendance` | `INSERT INTO attendance (...) RETURNING *` |
| `clockIn` | `userId: string` | `Attendance` | `INSERT INTO attendance (user_id, time_in, status) VALUES (:userId, NOW(), 'present') RETURNING *` |
| `clockOut` | `attendanceId: string, timeInString: string` | `Attendance` | Calculates `total_hours` from `time_in` to now, then `UPDATE attendance SET time_out=NOW(), total_hours=:hours WHERE id=:id` |

**Clock Out Calculation:**
```javascript
total_hours = (new Date() - new Date(timeInString)) / (1000 * 60 * 60)
// Rounded to 2 decimal places
```

### 7.5 `announcementService` (src/services/announcementService.ts)

| Function | Parameters | Returns | SQL Equivalent |
|----------|-----------|---------|---------------|
| `getAnnouncements` | none | `Announcement[]` | `SELECT * FROM announcements` |
| `createAnnouncement` | `{ title, content, priority, created_by, visibility }` | `Announcement` | `INSERT INTO announcements (...) RETURNING *` |

### 7.6 `evaluationService` (src/services/evaluationService.ts)

| Function | Parameters | Returns | SQL Equivalent |
|----------|-----------|---------|---------------|
| `getEvaluations` | none | `Evaluation[]` | `SELECT * FROM evaluations` (RLS filtered) |
| `createEvaluation` | `Omit<Evaluation, 'id' \| 'created_at'>` | `Evaluation` | `INSERT INTO evaluations (...) RETURNING *` |

---

## 8. Edge Functions

### 8.1 `upgrade-user-role` (Deno → Laravel Controller)

**Location:** `supabase/functions/upgrade-user-role/index.ts`

**Purpose:** Securely upgrade a user's role (intern → admin or intern → supervisor). Uses the service role key server-side to update both the auth metadata and the database profile.

**Current Behavior:**
1. Authenticate the requesting user via JWT
2. Verify the requester is an admin (check `users` table for `role = 'admin'`)
3. Validate input: `userId` and `newRole` (must be 'admin', 'supervisor', or 'intern')
4. Update auth user metadata: `{ role: newRole }`
5. Update `users` table: `SET role = newRole WHERE id = userId`
6. Return success/error JSON

**Laravel Equivalent:**
```php
// POST /api/users/upgrade-role
// Request: { userId: string, newRole: 'admin'|'supervisor'|'intern' }
// Middleware: auth:sanctum, role:admin

public function upgradeRole(Request $request)
{
    $request->validate([
        'userId' => 'required|exists:users,id',
        'newRole' => 'required|in:admin,supervisor,intern',
    ]);

    $user = User::findOrFail($request->userId);
    $user->role = $request->newRole;
    $user->save();

    return response()->json([
        'message' => "User {$user->id} upgraded to {$request->newRole} successfully."
    ]);
}
```

---

## 9. Realtime Features

### 9.1 How Realtime Works in Supabase

Supabase Realtime uses PostgreSQL's **Change Data Capture (CDC)** and pushes events over WebSocket. The frontend subscribes to specific tables and receives `INSERT`, `UPDATE`, `DELETE` events.

### 9.2 Current Realtime Subscriptions

| Component | Tables Subscribed | Event Types | Purpose |
|-----------|------------------|-------------|---------|
| Admin Dashboard | `users`, `announcements` | `*` (all) | Refresh dashboard stats and announcement list |
| Admin Announcements | `announcements` | `*` | Refresh announcement list |
| Admin ManageInterns | `users` | `*` | Refresh intern list |
| Admin ManageAdmins | `users` | `*` | Refresh admin list |
| Admin ManageSupervisors | `users` | `*` | Refresh supervisor list |
| Admin ManageTasks | `tasks` | `*` | Refresh task list |
| Supervisor Performance | `users`, `tasks` | `*` | Refresh performance data |
| AuthContext | `users` (filtered by own user ID) | `UPDATE` | Force sign-out if user is archived |

### 9.3 `useRealtime` Hook

```typescript
// Usage: useRealtime('tableName', callbackFunction)
// or:    useRealtime(['table1', 'table2'], callbackFunction)
//
// On any INSERT/UPDATE/DELETE on the subscribed table(s),
// callbackFunction is invoked (typically a refetch).
```

### 9.4 Laravel Replacement — Broadcasting

**Option A: Laravel Reverb (First-party, self-hosted)**
```php
// Install: composer require laravel/reverb
// In model events, broadcast changes:
class Task extends Model
{
    protected $dispatchesEvents = [
        'created' => TaskCreated::class,
        'updated' => TaskUpdated::class,
        'deleted' => TaskDeleted::class,
    ];
}

// Event class
class TaskCreated implements ShouldBroadcast
{
    public function broadcastOn()
    {
        return new Channel('tasks');
    }
}
```

**Option B: Pusher**
```php
// Set BROADCAST_DRIVER=pusher in .env
// Frontend: use laravel-echo + pusher-js
```

**Frontend Integration (Laravel Echo):**
```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const echo = new Echo({
    broadcaster: 'reverb', // or 'pusher'
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
});

// Replace useRealtime hook:
echo.channel('tasks').listen('.TaskCreated', () => { refetchTasks(); });
echo.channel('users').listen('.UserUpdated', () => { refetchUsers(); });
```

**If realtime is NOT required for MVP**, the simplest approach is **polling** — the frontend already has a 5-minute polling fallback in AuthContext that could be generalized.

---

## 10. Database Functions (RPCs)

### 10.1 `check_email_exists`

**Purpose:** Check if an email exists in the users table. Used for password reset to show "email not registered" before sending the reset email.

```sql
-- Supabase RPC
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE email = check_email);
END;
$$;
```

**Laravel Equivalent:**
```php
// POST /api/auth/check-email
public function checkEmailExists(Request $request)
{
    $exists = User::where('email', $request->email)->exists();
    return response()->json(['exists' => $exists]);
}
```

### 10.2 `get_intern_verification_stats`

**Purpose:** Returns counts of total, verified, and unverified interns by joining `auth.users` with `public.users`. Used on the Admin Dashboard.

**Note:** This RPC function is NOT in the migration files — it was likely created directly in Supabase SQL Editor. It joins `auth.users` (which contains `email_confirmed_at`) with `public.users`.

**Expected Return Type:**
```json
{
    "total_interns": 25,
    "verified_interns": 20,
    "unverified_interns": 5
}
```

**Laravel Equivalent:**
```php
// GET /api/dashboard/stats
public function getDashboardStats()
{
    $total = User::where('role', 'intern')->count();
    $verified = User::where('role', 'intern')
                    ->whereNotNull('email_verified_at')
                    ->count();
    $unverified = $total - $verified;

    $threeMonthsAgo = now()->subMonths(3);
    $recentRegisters = User::where('role', 'intern')
                           ->where('created_at', '>=', $threeMonthsAgo)
                           ->pluck('created_at');

    return response()->json([
        'totalInterns' => $total,
        'activeInterns' => $verified,
        'pendingApplications' => $unverified,
        'recentRegisters' => $recentRegisters,
    ]);
}
```

---

## 11. Database Triggers

### 11.1 `on_auth_user_created` → Auto-Create User Profile

**Supabase:** When a row is inserted into `auth.users`, this trigger inserts a row into `public.users` with metadata from the signup.

**Laravel Equivalent:** No trigger needed — the registration controller creates both the `users` record and `user_settings` record directly:

```php
// In RegisterController or UserService
public function register(Request $request)
{
    $user = User::create([
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'full_name' => $request->full_name,
        'role' => $request->role ?? 'intern',
        'avatar_url' => $request->avatar_url
            ?? 'https://ui-avatars.com/api/?name=' . urlencode($request->full_name) . '&background=random',
        'ojt_role' => $request->ojt_role,
        'start_date' => $request->start_date,
        'required_hours' => $request->required_hours,
        'ojt_type' => $request->ojt_type ?? 'required',
        'status' => 'active',
    ]);

    // Auto-create user settings
    UserSettings::create(['user_id' => $user->id]);

    return $user;
}
```

Alternatively, use a **Laravel Model Observer**:
```php
class UserObserver
{
    public function created(User $user)
    {
        UserSettings::create(['user_id' => $user->id]);
    }
}
```

### 11.2 `on_user_created_create_settings` → Auto-Create User Settings

**Supabase:** When a row is inserted into `public.users`, this trigger inserts default settings into `user_settings`.

**Laravel Equivalent:** Use the Model Observer above, or a `creating`/`created` event on the User model.

### 11.3 Auto-Increment `ojt_id` Sequence

**Supabase:** Uses a PostgreSQL sequence starting at 1101.

**Laravel/MySQL Equivalent:**
```php
// Option A: Set AUTO_INCREMENT start in migration
DB::statement('ALTER TABLE users AUTO_INCREMENT = 1101;');
// But this only works if ojt_id IS the primary key

// Option B: Generate in code (recommended)
$lastOjtId = User::max('ojt_id') ?? 1100;
$user->ojt_id = $lastOjtId + 1;
```

---

## 12. Email Templates

### 12.1 Email Verification Template

**File:** `email-templates/email-verification-template.html`

- Subject: "Verify Your Email - InternTrack"
- Contains: Branded HTML email with orange gradient header, verification button
- Template variable: `{{ .ConfirmationURL }}` (Supabase GoTrue syntax)
- Laravel equivalent variable: `{{ $verificationUrl }}` (Blade syntax)
- Link expires in 24 hours

### 12.2 Password Reset Template

**File:** `email-templates/reset-password-template.html`

- Subject: "Reset Your Password - InternTrack"
- Contains: Branded HTML email with lock icon, reset button
- Template variable: `{{ .ConfirmationURL }}`
- Laravel equivalent variable: `{{ $resetUrl }}`
- Link expires in 1 hour

**Laravel Implementation:**
```php
// Use Laravel Notifications
class ResetPasswordNotification extends Notification
{
    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Reset Your Password - InternTrack')
            ->view('emails.reset-password', [
                'resetUrl' => $this->resetUrl,
            ]);
    }
}
```

---

## 13. Validation Rules

The frontend uses **Zod** for client-side validation. These SAME rules must be enforced server-side in Laravel.

### 13.1 User Validation

```php
// Laravel FormRequest or inline validation
$rules = [
    'email' => 'required|email|unique:users,email',
    'full_name' => 'required|string|min:1',
    'avatar_url' => 'nullable|url',
    'role' => 'required|in:admin,supervisor,intern',
    'ojt_role' => 'nullable|string',
    'ojt_id' => 'nullable|integer',
    'start_date' => 'nullable|date',
    'required_hours' => 'nullable|integer',
    'ojt_type' => 'nullable|in:required,voluntary',
    'status' => 'nullable|in:active,archived',
];
```

### 13.2 Task Validation

```php
$rules = [
    'title' => 'required|string|min:1',
    'description' => 'required|string|min:1',
    'assigned_to' => 'required|uuid|exists:users,id',
    'status' => 'required|in:todo,in-progress,review,done',
    'priority' => 'required|in:low,medium,high',
    'due_date' => 'required|date',
    'created_by' => 'required|uuid|exists:users,id',
];
```

### 13.3 Attendance Validation

```php
$rules = [
    'user_id' => 'required|uuid|exists:users,id',
    'date' => 'required|date',
    'time_in' => 'required|date',
    'time_out' => 'nullable|date',
    'total_hours' => 'nullable|numeric',
    'status' => 'required|in:present,absent,late,excused',
];
```

### 13.4 Announcement Validation

```php
$rules = [
    'title' => 'required|string|min:1',
    'content' => 'required|string|min:1',
    'priority' => 'required|in:low,medium,high',
    'created_by' => 'required|uuid|exists:users,id',
    'visibility' => 'required|in:all,admin,supervisor,intern',
];
```

### 13.5 Evaluation Validation

```php
$rules = [
    'intern_id' => 'required|uuid|exists:users,id',
    'supervisor_id' => 'required|uuid|exists:users,id',
    'score' => 'required|integer|min:1|max:10',
    'feedback' => 'required|string|min:1',
    'evaluation_date' => 'required|date',
];
```

---

## 14. Frontend Integration Points

### 14.1 Files That Need Changes

When migrating to Laravel, the **frontend service layer** must be rewritten to use REST API calls instead of the Supabase SDK. Here are ALL files that interact with the backend:

#### Service Files (MUST be rewritten)

| File | Purpose | Changes Needed |
|------|---------|---------------|
| `src/services/supabaseClient.ts` | Supabase client initialization | **Replace entirely** with Axios/fetch instance pointing to Laravel API |
| `src/services/authService.ts` | All auth operations | Rewrite to call `/api/auth/*` endpoints |
| `src/services/userServices.ts` | All user CRUD + filters + stats | Rewrite to call `/api/users/*` endpoints |
| `src/services/taskServices.ts` | Task CRUD | Rewrite to call `/api/tasks/*` endpoints |
| `src/services/attendanceServices.ts` | Attendance CRUD + clock in/out | Rewrite to call `/api/attendance/*` endpoints |
| `src/services/announcementService.ts` | Announcement CRUD | Rewrite to call `/api/announcements/*` endpoints |
| `src/services/evaluationService.ts` | Evaluation CRUD | Rewrite to call `/api/evaluations/*` endpoints |
| `src/services/validation.ts` | Zod schemas | **Keep as-is** (client-side validation) |

#### Context Files (MUST be rewritten)

| File | Changes Needed |
|------|---------------|
| `src/context/AuthContext.tsx` | Replace Supabase auth listener with REST-based auth. Remove GoTrue-specific recovery detection. Use Sanctum session/token management. Remove realtime archived-user channel (use polling or Laravel Echo). |

#### Hook Files (MUST be rewritten)

| File | Changes Needed |
|------|---------------|
| `src/hooks/useRealtime.ts` | Replace Supabase Realtime channel subscription with Laravel Echo or polling |

#### Page Files with Direct Supabase Calls (MUST be updated)

| File | Direct Calls | Changes Needed |
|------|-------------|---------------|
| `src/pages/admin/ManageTasks.tsx` | `supabase.auth.getUser()` | Replace with auth context or API call |
| `src/pages/supervisor/Performance.tsx` | `supabase.from('users')`, `supabase.from('tasks')` | Replace with service layer calls |

### 14.2 Files That Need NO Changes

All other page components, layout components, CSS, and types files can remain as-is since they only consume data via the service layer.

---

## 15. Environment Variables

### Current (Supabase)

```env
VITE_SUPABASE_URL=https://vhzpbtgwfmhzrepualwc.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Optional, used for admin operations
```

### Target (Laravel)

```env
# Frontend .env
VITE_API_BASE_URL=https://your-laravel-api.com/api
VITE_PUSHER_APP_KEY=<pusher-key>          # If using Pusher for realtime
VITE_REVERB_APP_KEY=<reverb-key>          # If using Laravel Reverb
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080

# Laravel .env
APP_URL=https://your-laravel-api.com
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=interntrack
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173,your-frontend-domain.com
SESSION_DOMAIN=.your-domain.com

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=

BROADCAST_DRIVER=reverb  # or pusher
```

---

## 16. Laravel Migration Checklist

### Phase 1: Foundation

- [ ] Create Laravel project: `laravel new interntrack-api`
- [ ] Configure MySQL database
- [ ] Create database migrations (see Section 3)
- [ ] Create Eloquent models: `User`, `Task`, `Attendance`, `Announcement`, `Evaluation`, `UserSetting`
- [ ] Set up model relationships (see ERD in Section 3.2)
- [ ] Install Sanctum: `composer require laravel/sanctum`
- [ ] Configure CORS for React frontend

### Phase 2: Authentication

- [ ] Create `AuthController` with register, login, logout, forgot-password, reset-password
- [ ] Configure Sanctum SPA authentication
- [ ] Implement email verification (Laravel's built-in)
- [ ] Create email templates (convert HTML templates from `email-templates/`)
- [ ] Implement `check_email_exists` endpoint
- [ ] Implement archived user blocking on login
- [ ] Auto-generate avatar URL on signup
- [ ] Auto-generate `ojt_id` sequence on user creation
- [ ] Auto-create `user_settings` on user creation (observer)

### Phase 3: Authorization

- [ ] Create role middleware (`admin`, `supervisor`, `intern`)
- [ ] Create Laravel Policies: `UserPolicy`, `TaskPolicy`, `AttendancePolicy`, `AnnouncementPolicy`, `EvaluationPolicy`
- [ ] Map all RLS policies to Laravel policies (see Section 5)

### Phase 4: API Controllers

- [ ] `UserController` — all user CRUD, intern/admin/supervisor management, stats, archive, role upgrade
- [ ] `TaskController` — CRUD with role-based filtering
- [ ] `AttendanceController` — CRUD, clock in/out with hour calculation
- [ ] `AnnouncementController` — CRUD with visibility support
- [ ] `EvaluationController` — CRUD with supervisor/intern scoping
- [ ] `SettingsController` — user settings CRUD
- [ ] `DashboardController` — stats aggregation endpoint

### Phase 5: Validation

- [ ] Create Form Requests for all endpoints (see Section 13)
- [ ] Server-side validation matching Zod schemas

### Phase 6: Realtime (Optional)

- [ ] Install Laravel Reverb or configure Pusher
- [ ] Create broadcast events for: `UserUpdated`, `TaskCreated`, `TaskUpdated`, `AnnouncementCreated`, `AttendanceCreated`
- [ ] Update frontend `useRealtime` hook to use Laravel Echo

### Phase 7: Frontend Integration

- [ ] Replace `supabaseClient.ts` with Axios/fetch API client
- [ ] Rewrite all 6 service files to use REST API
- [ ] Rewrite `AuthContext.tsx` to use Sanctum auth
- [ ] Rewrite `useRealtime.ts` to use Laravel Echo (or polling)
- [ ] Fix direct Supabase calls in `ManageTasks.tsx` and `Performance.tsx`

### Phase 8: Testing

- [ ] Write API tests for all endpoints (Feature tests)
- [ ] Test RLS equivalents (authorization policies)
- [ ] Test email verification and password reset flows
- [ ] Test archived user sign-out behavior
- [ ] Test role upgrade flow
- [ ] End-to-end testing with React frontend

---

## 17. Recommended Laravel Stack

| Component | Recommendation | Why |
|-----------|---------------|-----|
| **Framework** | Laravel 11+ | Latest LTS, best ecosystem |
| **Auth** | Laravel Sanctum | SPA-friendly, simpler than Passport for this use case |
| **Database** | MySQL 8.0+ | Supports JSON, CTEs, window functions |
| **ORM** | Eloquent | Built-in, covers all needs |
| **Validation** | Form Requests | Built-in, mirrors Zod rules |
| **Email** | Laravel Mail + Notifications | Built-in, supports templates |
| **Realtime** | Laravel Reverb | First-party, free, self-hosted |
| **API Docs** | Scramble or L5-Swagger | Auto-generated API documentation |
| **Testing** | PHPUnit + Pest | Laravel's built-in testing tools |
| **CORS** | `fruitcake/laravel-cors` (built into Laravel 11) | Required for React SPA |

### Eloquent Model Relationships

```php
// User.php
class User extends Authenticatable
{
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function interns()
    {
        return $this->hasMany(User::class, 'supervisor_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function evaluationsAsIntern()
    {
        return $this->hasMany(Evaluation::class, 'intern_id');
    }

    public function evaluationsAsSupervisor()
    {
        return $this->hasMany(Evaluation::class, 'supervisor_id');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function settings()
    {
        return $this->hasOne(UserSetting::class);
    }
}

// Task.php
class Task extends Model
{
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

// Attendance.php
class Attendance extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// Announcement.php
class Announcement extends Model
{
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

// Evaluation.php
class Evaluation extends Model
{
    public function intern()
    {
        return $this->belongsTo(User::class, 'intern_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}

// UserSetting.php
class UserSetting extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### Suggested Laravel Route File

```php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/auth/check-email', [AuthController::class, 'checkEmailExists']);
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);

    // Intern management (Admin)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users/interns', [UserController::class, 'listInterns']);
        Route::get('/users/interns/stats', [UserController::class, 'internStats']);
        Route::put('/users/interns/{id}', [UserController::class, 'updateIntern']);
        Route::put('/users/interns/{id}/archive', [UserController::class, 'toggleArchiveIntern']);
        Route::get('/users/interns/ojt-roles', [UserController::class, 'ojtRoles']);
        Route::get('/users/interns/for-upgrade', [UserController::class, 'internsForUpgrade']);
        Route::post('/users/upgrade-role', [UserController::class, 'upgradeRole']);

        // Admin management
        Route::get('/users/admins', [UserController::class, 'listAdmins']);
        Route::get('/users/admins/stats', [UserController::class, 'adminStats']);
        Route::put('/users/admins/{id}/archive', [UserController::class, 'toggleArchiveAdmin']);

        // Supervisor management
        Route::get('/users/supervisors', [UserController::class, 'listSupervisors']);
        Route::get('/users/supervisors/stats', [UserController::class, 'supervisorStats']);
        Route::put('/users/supervisors/{id}/archive', [UserController::class, 'toggleArchiveSupervisor']);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/recent-interns', [DashboardController::class, 'recentInterns']);
    });

    // Tasks
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('role:admin,supervisor');
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->middleware('role:admin');

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::put('/attendance/{id}/clock-out', [AttendanceController::class, 'clockOut']);

    // Announcements
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::post('/announcements', [AnnouncementController::class, 'store'])->middleware('role:admin');
    Route::put('/announcements/{id}', [AnnouncementController::class, 'update'])->middleware('role:admin');
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy'])->middleware('role:admin');

    // Evaluations
    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::post('/evaluations', [EvaluationController::class, 'store'])->middleware('role:supervisor');

    // User Settings
    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
```

---

## Appendix A: Pages Currently Using Mock/Hardcoded Data

These pages exist in the frontend but do NOT yet connect to real backend data. When building the Laravel API, be aware these will eventually need endpoints but are **low priority**:

| Page | Status |
|------|--------|
| Admin MonitorAttendance | Uses hardcoded sample data |
| Admin Reports | Uses hardcoded sample data |
| Admin Settings | Placeholder |
| Student Announcements | Placeholder |
| Student DailyLogs | Placeholder |
| Student PerformanceFeedback | Placeholder |
| Student Reports | Placeholder |
| Student Schedule | Placeholder |
| Student Settings | Placeholder |
| Student TaskList | Hardcoded static data |
| Supervisor Dashboard | Hardcoded dummy data |
| Supervisor Announcements | Hardcoded static data |
| Supervisor ManageInterns | Placeholder |
| Supervisor ManageTasks | Placeholder |
| Supervisor MonitorAttendance | Hardcoded static data |
| Supervisor Evaluations | Empty state |
| Supervisor FeedbackDashboard | Hardcoded dummy data |
| Supervisor InternPerformance | Hardcoded static data |
| Supervisor Approvals | Hardcoded static data |
| Supervisor Reports | Placeholder |
| Supervisor Settings | Hardcoded static form |

---

## Appendix B: Supabase Project Reference

- **Project Ref:** `vhzpbtgwfmhzrepualwc`
- **Supabase URL:** `https://vhzpbtgwfmhzrepualwc.supabase.co`
- **DB Push Command:** `npx supabase db push`
- **Migration List:** `npx supabase migration list`

---

## Appendix C: File Storage

**No file storage is used anywhere in this project.** No `supabase.storage` calls exist. If file uploads (e.g., profile pictures, document submissions) are needed in the future, use **Laravel Storage** with an S3-compatible driver.

---

*End of Migration Guide*
