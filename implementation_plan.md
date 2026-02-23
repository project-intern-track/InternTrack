# Task Distribution Plan - InternTrack

## Goal Description
Distribute development tasks for the "InternTrack" application based on the provided Figma designs and team composition. The goal is to efficiently assign features to Frontend (FE), Backend (BE), and Full Stack (FS) developers to move from the current basic state to a fully functional application.

## Team Composition & Roles
- **Clement (FS - Lead)**: Full Stack - Core Architecture, Code Review, "Glue" Code, Reports, Lead Developer
- **Nathaniel (FS)**: Full Stack - Admin Features (Manage Interns, Announcements, Settings)
- **Victor (BE)**: Backend - API, Database, Security
- **Angelito (FE)**: Frontend - Admin Dashboard & Styling
- **Yuan (FE)**: Frontend - Admin Features (Tasks, Attendance)
- **Kevin (FE)**: Frontend - Intern Feedback, Announcements Display, Settings Profile UI
- **Judito (FE)**: Frontend - Intern UI Focus
- **Jay (FE)**: Frontend - Supervisor UI Focus

## Database Schema (Supabase)
The following tables will be created in Supabase to support the application features.

### 1. `users` (Managed by Supabase Auth + Public Profile)
Extends the default `auth.users` table.
- `id` (UUID, Primary Key, references `auth.users.id`)
- `email` (Text, Unique)
- `full_name` (Text)
- `avatar_url` (Text)
- `role` (Text - Enum: 'admin', 'supervisor', 'intern')
- `created_at` (Timestamp)

### 2. `tasks`
Stores tasks assigned to interns.
- `id` (UUID, Primary Key)
- `title` (Text)
- `description` (Text)
- `assigned_to` (UUID, references `users.id`)
- `status` (Text - Enum: 'todo', 'in-progress', 'review', 'done')
- `priority` (Text - Enum: 'low', 'medium', 'high')
- `due_date` (Timestamp)
- `created_by` (UUID, references `users.id`)
- `created_at` (Timestamp, Default: now())

### 3. `attendance`
Logs intern attendance (time-in/time-out).
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `users.id`)
- `date` (Date)
- `time_in` (Timestamp)
- `time_out` (Timestamp)
- `total_hours` (Float)
- `status` (Text - Enum: 'present', 'absent', 'late', 'excused')
- `created_at` (Timestamp, Default: now())

### 4. `announcements`
Global announcements visible to all or specific roles.
- `id` (UUID, Primary Key)
- `title` (Text)
- `content` (Text)
- `created_by` (UUID, references `users.id`)
- `visibility` (Text - Enum: 'all', 'interns', 'supervisors')
- `created_at` (Timestamp, Default: now())

### 5. `evaluations`
Performance evaluations for interns.
- `id` (UUID, Primary Key)
- `intern_id` (UUID, references `users.id`)
- `supervisor_id` (UUID, references `users.id`)
- `score` (Integer, 1-10 or 1-5)
- `feedback` (Text)
- `evaluation_date` (Date)
- `created_at` (Timestamp, Default: now())

## Git Workflow & Collaboration Strategy
To avoid merge conflicts, we will follow a strict **Feature Branch Workflow**.

### 1. Branching Strategy
- **`main`**: Production-ready code. Do NOT push directly to main.
- **`dev`**: Integration branch. All features merge here first.
- **`feature/feature-name`**: Individual developer branches.

### 2. Branch Naming Convention
- `feature/admin-dashboard` (Angelito)
- `feature/manage-interns` (Nathaniel)
- `feature/manage-tasks` (Yuan)
- `feature/intern-feedback` (Kevin)
- `feature/intern-tasks` (Judito)
- `feature/supervisor-panel` (Jay)
- `backend/auth-setup` (Victor)
- `fix/login-bug` (Clement)

### 3. Preventing Conflicts
- **Component Isolation**:
    - **Angelito** works *only* in `src/pages/admin/dashboard`, `src/pages/admin/supervisors` and `src/styles`.
    - **Nathaniel** works in `src/pages/admin/interns`, `src/pages/admin/admins`, `src/pages/admin/announcements`.
    - **Yuan** works in `src/pages/admin/tasks` and `src/pages/admin/attendance`.
    - **Kevin** works in `src/pages/student/feedback`, `src/pages/student/announcements`, `src/pages/*/settings` (shared settings UI across all roles).
    - **Judito** works *only* in `src/pages/student` (dashboard, tasks, timelog).
    - **Jay** works *only* in `src/pages/supervisor` (dashboard, approvals, evaluations, feedback, monitor-attendance, performance).
    - **Victor** works *only* on Supabase/API and `src/services`.
    - **Clement**: Handle shared components (`src/components/common`) and routing (`App.tsx`).
- **Pull Before Push**: Always run `git pull origin dev` before creating a PR to ensure you have the latest changes.
- **Small PRs**: Submit small, focused Pull Requests. Don't touch files outside your assigned module.

## Priority 1: Foundation (Core)
**Necessary First To Do**
These tasks must be completed first to allow other work to proceed.

- [x] **Database Schema & Auth Setup** (Victor - BE) ✅ **COMPLETE**
    - ✅ Define tables: Users, Tasks, Attendance, Announcements.
    - ✅ RLS Policies created in SQL migration.
    - ⚠️ **PENDING**: Real Supabase authentication integration (see below).
- [x] **Project Structure & Routing** (Clement - FS) ✅ **COMPLETE**
    - ✅ Set up protected routes for Admin, Intern, Supervisor.
    - ✅ Implement Sidebar/Navigation that changes based on User Role.
- [x] **Global Styling & Theme** (Yuan - FE) ✅ **COMPLETE**
    - ✅ Implement Figma color palette, typography (variables.css).
    - ✅ Comprehensive design system with 800+ lines of CSS.
- [x] **Authentication System** (Victor - BE + Clement - FS) ✅ **COMPLETE**
    - ✅ Created `authService.ts` with Supabase Auth integration:
        - `signUp(email, password, metadata)` - Register new users
        - `signIn(email, password)` - Login existing users
        - `signOut()` - Logout users
        - `resetPassword(email)` - Password recovery
        - `updatePassword(newPassword)` - Change password
    - ✅ Updated `AuthContext.tsx` to use real Supabase auth instead of mock
    - ✅ Created proper Login page with email/password form
    - ✅ Created Signup page for new user registration
    - ✅ Created ForgotPassword and ResetPassword pages
    - ✅ Handle auth state persistence and session management

## Priority 2: Admin Panel
- [ ] **Admin Dashboard** (Angelito - FE)
    - Implement analytics widgets (Total Interns, Active, etc.).
- [ ] **Manage Interns** (Nathaniel - FS)
    - CRUD (Create, Read, Update, Delete) functionality for Intern accounts.
    - "Intern List" table with filtering.
    - Backend logic support (Victor - BE).
- [ ] **Manage Admins** (Nathaniel - FS)
    - Create, Read, Update, Delete admin accounts.
    - Admin list table with role assignment.
    - Backend database logic (Victor - BE).
- [ ] **Manage Supervisors** (Angelito - FE)
    - UI for managing supervisor accounts and assignments.
    - Link supervisors to intern groups.
    - Backend support (Victor - BE).
- [ ] **Manage Tasks** (Yuan - FE)
    - UI for creating tasks and assigning them to interns.
    - Backend logic to link tasks to users (Victor - BE support).
- [ ] **Monitor Attendance** (Yuan - FE)
    - View daily attendance logs.
    - "Time In / Time Out" display logic.
- [ ] **Create Announcements** (Nathaniel - FS)
    - Form to post announcements visible to all interns.
    - API and database logic for announcements.
- [ ] **Reports** (Clement - FS Lead)
    - Generate PDF/Excel reports for Weekly/Monthly summaries.
    - Printable Internship Report logic.
- [ ] **Admin Settings** (Nathaniel - FS Integration, Kevin - FE UI)
    - System settings and configuration.

## Priority 3: Intern Portal
- [ ] **Intern Dashboard** (Judito - FE)
    - Welcome screen, quick stats (Hours rendered, Tasks done).
- [ ] **Task List** (Judito - FE)
    - Kanban or List view of assigned tasks.
    - Ability to mark tasks as "In Progress" or "Done".
- [ ] **Time Log** (Judito - FE)
    - "Clock In/Out" button functionality.
    - Timer/Calculator for hours rendered.
- [ ] **Performance Feedback** (Kevin - FE)
    - Read-only view of supervisor feedback.

## Priority 4: Supervisor Panel
- [ ] **Supervisor Dashboard** (Jay - FE)
    - Overview of assigned interns.
- [ ] **Approve Tasks** (Jay - FE)
    - Interface to review work submitted by interns.
    - "Approve" and "Reject" actions.
- [ ] **Intern Performance Overview** (Jay - FE)
    - High-level view of all assigned interns' performance metrics.
- [ ] **Evaluations & Feedback** (Jay - FE)
    - Forms for evaluating intern performance.
- [ ] **Monitor Attendance (Supervisor View)** (Jay - FE)
    - Track attendance of assigned interns.
    - View time logs and attendance records.
- [ ] **Supervisor Settings** (Nathaniel - FS Integration, Kevin - FE UI)
    - Supervisor profile management and preferences.

## Priority 5: Advanced Features & Polish
- [ ] **Announcements Display** (Kevin - FE)
    - Intern-facing view of announcements.

## Verification Plan

### Automated Tests
- **Unit Tests**:
  - `npm test` to run existing tests (if any).
  - Devs to write unit tests for utility functions (e.g., Time calculation).
- **Linting**:
  - `npm run lint` to enforce code quality.

### Manual Verification
1.  **Role Switching**:
    - Log in as Admin -> Verify Admin routes accessible, others denied.
    - Log in as Intern -> Verify Intern routes accessible, others denied.


## Daily Task Distribution (2-Week Timeline)
This schedule distributes the work over 10 working days, allowing more time for development and testing.

### Week 1: Foundation & Core Feature
*Goal: Database, Auth, and Static UI for all modules.*




#### Days 1-2: Setup & Configuration
*   **Clement (FS - Lead)**:
    *   [x] Set up Supabase Project (Completed). [High]
    *   [x] Project scaffolding, React Router implementation, Layout wrappers. [High]
    *   [x] Run SQL scripts to create Tables (`users`, `tasks`, `attendance`), RLS Policies. [High]
    *   [x] GitHub Repo setup, AuthProvider context. [High]
*   **Victor (BE)**:
    *   [x] Define TypeScript Interfaces/Types for all DB tables. [High]
    *   [x] Set up Zod schemas for input validation (API Layer). [High]
*   **Yuan (FE)**: [x] Global CSS, Design System (Variables, Typography). [High] ✅
*   **Nathaniel, Yuan, Kevin, Judito, Jay**: [x] Environment setup, codebase study. [High]

#### Days 3-4: Authentication & Static UI Implementation
*   **Victor (BE) + Clement (FS)**: [ ] **Authentication System** [CRITICAL]
    *   Create `authService.ts` with real Supabase Auth
    *   Update `AuthContext.tsx` to replace mock auth
    *   Implement Sign Up, Sign In, Sign Out, Password Reset
    *   Update Login page with email/password form
    *   Test auth flow and session persistence
*   **Angelito (FE)**: []`AdminDashboard` UI (Sidebar, Stats Grid), `ManageSupervisors` Table UI. [Medium]
*   **Nathaniel (FS)**: []`ManageInterns` Table UI, "Add Intern" Modal, `ManageAdmins` Table UI, Announcements Form UI. [Medium]
*   **Yuan (FE)**: []`ManageTasks` UI, `MonitorAttendance` UI. [Medium]
*   **Kevin (FE)**: []`PerformanceFeedback` UI, Settings Profile Form UI (Intern, Admin, Supervisor variants), `AnnouncementsDisplay` UI. [Medium]
*   **Judito (FE)**: []`StudentDashboard` UI, `TaskCard` component, `TimeLog` Widget UI. [Medium]
*   **Jay (FE)**: []`SupervisorDashboard` UI (Intern List), `MonitorAttendance` (Supervisor View), `InternPerformance` Overview. [Medium]
*   **Victor (BE)**: []Announcements API & DB logic. [Medium]

#### Day 5: Backend Logic & API Construction
*   **Victor (BE)**:
    *   [ ] Implement `src/services` layer (Supabase wrappers). [High]
    *   [ ] Write functions: `fetchInterns()`, `createTask()`, `clockIn()`. [High]
*   **Clement (FS)**:
    *   [ ] Helper functions for date formatting. [Medium]
    *   [ ] Review RLS policies. [High]
*   **Clement (FS)**: []Routing logic refinements (Redirects, Loading states). [Medium]

### Week 2: Integration & Advanced Features
*Goal: Connect FE to BE, functionality, and polish.*

#### Days 6-7: Data Integration (Connecting FE to Supabase)
*   **Nathaniel (FS)**: Connect "Add Intern" -> Supabase Auth `signUp`, Connect "Manage Admins" to API, Connect Announcements to API. [High]
*   **Yuan (FE)**: []Connect "Manage Tasks" to API, Connect "Monitor Attendance" to API. [High]
*   **Angelito (FE)**: []Connect "Manage Supervisors" to supervisor API. [High]
*   **Kevin (FE)**: []Connect "Performance Feedback" to evaluations API. [Medium]
*   **Judito (FE)**: []Fetch Tasks -> Display on Dashboard -> "Mark as Done", Connect "Clock In/Out". [High]
*   **Jay (FE)**: []Fetch Intern list -> Display on Supervisor Dashboard, Connect "Monitor Attendance" (Supervisor View), Fetch Performance metrics. [High]
*   **Angelito (FE)**: []Connect Admin Dashboard analytics widgets to live data. [Medium]

#### Days 8-9: Advanced Modules
*   **Clement (FS)**:[] Reports Logic (Generate CSV/PDF), Print Layouts. [Medium]
*   **Nathaniel (FS)**:[] Settings & Profile integration (with Kevin's UI - all user types), Announcements polish, Manage Admins refinement. [Medium]
*   **Jay (FE)**: []"Approve Tasks" flow (Supervisor approves implementation), "Intern Performance" dashboard refinement, Supervisor Settings integration. [Medium]
*   **Kevin (FE)**: []Announcements Display integration (intern-facing view), Settings UI polish for all user types. [Low]
*   **Victor (BE)**: []Optimize queries, secure endpoints, admin/supervisor user management APIs. [Medium]
*   **Angelito (FE)**: []Chart.js integration for Admin Analytics, Manage Supervisors UI polish. [Low]
*   **Judito (FE)**: Intern Dashboard polish, edge cases. [Low]

#### Day 10: Testing, Polish & Deployment
*   **Clement (Lead)**: Final Code Review, Merge `dev` -> `main`. [High]
*   **Whole Team**:
    *   [ ] **Bug Hunting**: Try to break the app. [High]
    *   [ ] **Cross-Browser & Mobile Check**. [Medium]
    *   [ ] **Fix UI Glitches**. [Medium]
*   **Clement**: Deploy to Vercel (Production). [High]



