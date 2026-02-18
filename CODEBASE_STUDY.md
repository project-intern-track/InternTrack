# InternTrack - Codebase Study Guide

## Quick Start

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your Supabase credentials
# Get them from: https://app.supabase.com > Your Project > Settings > API

# Start development server
npm run dev
```

### 2. Check Database Connection
```bash
# Link to Supabase (if you have CLI installed)
npm run db:link

# Check migration status
npm run db:status
```

---

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router DOM v7
- **Styling**: Plain CSS (custom variables in `src/styles/variables.css`)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Context API
- **Validation**: Zod
- **Icons**: Lucide React

---

## Folder Structure

```
InternTrack/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts
│   ├── components/        # Reusable components
│   │   └── layout/        # Layout components (Sidebar, Header)
│   ├── context/           # React Context providers
│   │   └── AuthContext.tsx    # Authentication state
│   ├── layouts/           # Page layouts
│   │   └── DashboardLayout.tsx
│   ├── pages/             # Page components (organized by role)
│   │   ├── admin/         # Admin pages (Angelito, Nathaniel)
│   │   ├── student/       # Intern pages (Judito, Kevin)
│   │   ├── supervisor/    # Supervisor pages (Jay)
│   │   └── public/        # Public pages (Login)
│   ├── services/          # API/Database layer (Victor)
│   │   ├── supabaseClient.ts  # Supabase client instance
│   │   ├── userServices.ts
│   │   ├── taskServices.ts
│   │   ├── attendanceServices.ts
│   │   ├── announcementService.ts
│   │   ├── evaluationService.ts
│   │   └── validation.ts      # Zod schemas
│   ├── styles/            # Global styles
│   │   └── variables.css      # CSS variables (Yuan)
│   ├── types/             # TypeScript types
│   │   ├── database.types.ts  # Database interfaces
│   │   └── index.ts           # Shared types
│   ├── App.tsx            # Main app with routing (Clement)
│   └── main.tsx           # Entry point
├── supabase/
│   └── migrations/        # Database migrations
└── package.json
```

---

## Key Files Overview

### 1. Authentication (`src/context/AuthContext.tsx`)
- **Current State**: Mock authentication (simulated login)
- **What it does**: 
  - Manages user state (logged in/out)
  - Stores current user info (id, name, email, role)
  - Provides `login()` and `logout()` functions
- **Next Steps**: Connect to real Supabase auth (Victor's task)

### 2. Routing (`src/App.tsx`)
- **Role-based routing**:
  - `/` → Login page
  - `/intern/*` → Intern dashboard & pages
  - `/supervisor/*` → Supervisor dashboard & pages  
  - `/admin/*` → Admin dashboard & pages
- **ProtectedRoute**: Blocks unauthorized access
- **Already implemented**: Routing structure is complete

### 3. Database Types (`src/types/database.types.ts`)
- ✅ Defines all table interfaces:
  - `Users` (id, email, full_name, role)
  - `Tasks` (title, description, status, priority)
  - `Attendance` (user_id, date, time_in, time_out)
  - `Announcements` (title, content, visibility)
  - `Evaluations` (intern_id, score, feedback)

### 4. Supabase Client (`src/services/supabaseClient.ts`)
- **Connection to Supabase**
- Reads from `.env` file:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Usage**: Import `supabase` from this file in service layers

### 5. Database Schema (`supabase/migrations/001_create_tables_and_rls.sql`)
- Creates 5 tables: `users`, `tasks`, `attendance`, `announcements`, `evaluations`
- **Row Level Security (RLS)** enabled:
  - Admins can see/edit everything
  - Interns can only see their own data
  - Supervisors can see their assigned interns

---

## Component Isolation (Avoid Merge Conflicts!)

### Where Each Person Works

| Developer | Files to Touch | Do NOT Touch |
|-----------|---------------|--------------|
| **Angelito** | `src/pages/admin/AdminDashboard.tsx`<br>`src/styles/*` | Other pages |
| **Nathaniel** | `src/pages/admin/interns/*`<br>`src/pages/admin/announcements/*`<br>`src/services/announcementService.ts` | Student/Supervisor pages |
| **Yuan** | `src/pages/admin/tasks/*`<br>`src/pages/admin/attendance/*`<br>`src/styles/variables.css` | Other pages |
| **Kevin** | `src/pages/student/feedback/*`<br>`src/pages/student/announcements/*`<br>`src/pages/settings/*` | Admin/Supervisor pages |
| **Judito** | `src/pages/student/StudentDashboard.tsx`<br>`src/pages/student/tasks/*`<br>`src/pages/student/timelog/*` | Admin/Supervisor pages |
| **Jay** | `src/pages/supervisor/*` | Admin/Student pages |
| **Victor** | `src/services/*` (all service files)<br>`supabase/migrations/*` | Components/Pages |
| **Clement** | `src/components/common/*`<br>`src/App.tsx`<br>Code reviews | Everything (Lead) |

---

## Common Patterns

### 1. Fetching Data from Supabase
```typescript
import { supabase } from '../services/supabaseClient';
import type { Tasks } from '../types/database.types';

// Example: Fetch all tasks
async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  
  return data as Tasks[];
}
```

### 2. Creating a Service Function (Victor's Pattern)
```typescript
// src/services/taskServices.ts
import { supabase } from './supabaseClient';
import type { Tasks } from '../types/database.types';

export async function createTask(taskData: Partial<Tasks>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 3. Using Context in Components
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

---

## Git Workflow Reminder

### Before Starting Work
```bash
# 1. Make sure you're on dev branch
git checkout dev

# 2. Pull latest changes
git pull origin dev

# 3. Create your feature branch
git checkout -b feature/your-feature-name
```

### While Working
```bash
# Commit frequently
git add .
git commit -m "feat: add task list UI"
```

### When Done
```bash
# Push to your branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub:
# - Base: dev
# - Compare: feature/your-feature-name
# - Request review from Clement
```

---

## Current Project Status (✅ Done)

### ✅ Completed (Days 1-2)
- [x] Supabase project created
- [x] Database tables created (`users`, `tasks`, `attendance`, `announcements`, `evaluations`)
- [x] TypeScript types defined
- [x] Routing structure implemented
- [x] AuthContext created
- [x] Protected routes working
- [x] Basic dashboard layouts exist
- [x] Sidebar navigation implemented

### 🚧 In Progress (Days 3-4) - **YOUR WORK STARTS HERE**
- [ ] Global CSS styling (Yuan)
- [ ] Admin Dashboard UI (Angelito)
- [ ] Manage Interns UI (Nathaniel)
- [ ] Manage Tasks UI (Yuan)
- [ ] Monitor Attendance UI (Yuan)
- [ ] Student Dashboard UI (Judito)
- [ ] Supervisor Dashboard UI (Jay)
- [ ] Performance Feedback UI (Kevin)

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Supabase (if CLI installed)
npm run db:link          # Link to Supabase project
npm run db:push          # Push migrations
npm run db:status        # Check migration status
```

---

## Need Help?

1. **TypeScript errors**: Check `src/types/database.types.ts` for correct interfaces
2. **Supabase auth**: See `src/context/AuthContext.tsx` (will be updated by Victor)
3. **Routing issues**: Check `src/App.tsx`
4. **Environment setup**: Ask Clement
5. **Backend/API**: Ask Victor
6. **Merge conflicts**: Ask Clement

---

## Next Steps for Each Developer

### Yuan (FE)
1. ✅ Read this guide
2. Create `src/styles/variables.css` with design system colors
3. Build `src/pages/admin/tasks/ManageTasks.tsx` (static UI first)
4. Build `src/pages/admin/attendance/MonitorAttendance.tsx` (static UI first)

### Nathaniel (FS)
1. ✅ Read this guide
2. Build `src/pages/admin/interns/ManageInterns.tsx` (table + modal)
3. Build `src/pages/admin/announcements/CreateAnnouncement.tsx` (form)
4. Wait for Victor's service functions, then connect UI to API

### Angelito (FE)
1. ✅ Read this guide
2. Update `src/pages/admin/AdminDashboard.tsx` with analytics widgets
3. Style sidebar and layout components
4. Create consistent color palette

### Kevin (FE)
1. ✅ Read this guide
2. Build `src/pages/student/feedback/PerformanceFeedback.tsx`
3. Build `src/pages/student/announcements/AnnouncementsDisplay.tsx`
4. Build `src/pages/settings/Profile.tsx`

### Judito (FE)
1. ✅ Read this guide
2. Build `src/pages/student/StudentDashboard.tsx` (welcome screen + stats)
3. Build `src/pages/student/tasks/TaskList.tsx` (Kanban/List view)
4. Build `src/pages/student/timelog/TimeLog.tsx` (Clock in/out)

### Jay (FE)
1. ✅ Read this guide
2. Build `src/pages/supervisor/SupervisorDashboard.tsx`
3. Build `src/pages/supervisor/approvals/ApproveT.tsx`
4. Build `src/pages/supervisor/evaluations/EvaluationForm.tsx`

### Victor (BE)
1. ✅ Read this guide
2. Implement all functions in `src/services/` files
3. Set up real Supabase authentication
4. Test RLS policies

---

**Good luck! Remember: Small commits, frequent pushes, and always pull before creating a PR!** 🚀
