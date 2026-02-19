# InternTrack — Task List & Status Tracker

> **Last Updated:** February 19, 2026
> **Legend:** ✅ Done (live data connected) · 🔶 Static UI Only (no backend) · 🟡 In Branch (not merged to main) · ❌ Not Started

---

## Team & GitHub Usernames

| GitHub Username | Name | Role | Focus Area |
|---|---|---|---|
| `clementiii` | Clement | Full Stack Lead | Architecture, Auth, Core pages, Bug fixes, Code review |
| `GGKanki` | Victor | Backend | Supabase API, services layer, DB, security |
| `aeio-vldrm` | Angelito | Frontend | Admin Dashboard, Manage Supervisors |
| `yuancrispino11-hash` | Yuan | Frontend | Admin Manage Tasks, Monitor Attendance |
| `ItamiDeishu` | Kevin | Frontend | Performance Feedback, Settings UI (all roles), Announcements Display |
| `judsssss` | Judito | Frontend | Intern Dashboard, Task List, Time Log |
| `JJTan9` | Jay | Frontend | Supervisor Dashboard, Approvals, Evaluations, Feedback, Attendance |

> ⚠️ **Nathaniel has been removed from the team.** His originally planned tasks (Manage Admins) are now assigned to **Clement**.
> ⚠️ **Kevin (`ItamiDeishu`) has 0 commits** as of this date. All assigned tasks remain not started.

---

## CONTRIBUTIONS BY MEMBER (Based on Git History)

| Member | GitHub | What They've Pushed |
|---|---|---|
| Clement | `clementiii` | Auth system (Login, Signup, ForgotPassword, ResetPassword, VerifyEmail), AuthContext, authService, core routing, Sidebar, TopBar, DashboardLayout, ManageInterns, Announcements, StudentDashboard (Supabase connected), global styles, multiple bug fix PRs (v1.0–v1.4) |
| Victor | `GGKanki` | addIntern→Supabase signup integration, createAnnouncement backend, intern signup verification layer, search filter fix, ManageIntern mobile UI fix, loading state fix · **Next:** service functions for all static pages (see Detailed Notes) |
| Angelito | `aeio-vldrm` | Admin Dashboard UI (Chart.js, animations, card colors, activity section) — `feature/admin-dashboard` branch not yet merged · Manage Supervisors (placeholder, header, stats cards, search/filter) — **merged to main** (static UI, no Supabase) |
| Yuan | `yuancrispino11-hash` | Manage Tasks UI (static card layout, filters, search — no modal, no Supabase) |
| Kevin | `ItamiDeishu` | **No commits pushed yet** |
| Judito | `judsssss` | Student Dashboard initial UI, card animation fix |
| Jay | `JJTan9` | All Supervisor pages: FeedbackDashboard (static), Settings (static), MonitorAttendance (static), SupervisorApprovals (static), SupervisorAnnouncements (static), InternPerformance (static), SupervisorDashboard (✅ live Supabase connected) |

---

## STATUS SUMMARY

### INTERN PORTAL

| # | Page / Feature | Status | Assigned | Contributor(s) |
|---|---|---|---|---|
| 1 | **Dashboard** | 🔶 Partial — Announcements live, stat boxes hardcoded | Judito + Victor (BE) | Judito (initial UI) · Clement (announcements fetch, bug fixes) |
| 2 | **Task List** | ❌ Not Started | Judito + Victor (BE) | — |
| 2a | ↳ All Tasks Section | ❌ Not Started | Judito + Victor (BE) | — |
| 2b | ↳ In Progress Section | ❌ Not Started | Judito + Victor (BE) | — |
| 2c | ↳ Completed Section | ❌ Not Started | Judito + Victor (BE) | — |
| 2d | ↳ Overdue Section | ❌ Not Started | Judito + Victor (BE) | — |
| 3 | **Time Log** | ❌ Not Started | Judito + Victor (BE) | — |
| 4 | **Performance Feedback** | ❌ Not Started | Kevin + Victor (BE) | — |
| 5 | **Settings** | ❌ Not Started | Kevin + Victor (BE) | — |

---

### ADMIN PANEL

| # | Page / Feature | Status | Assigned | Contributor(s) |
|---|---|---|---|---|
| 1 | **Admin Dashboard** | 🟡 In Branch (not merged) | Angelito | Angelito (Chart.js, animations, stat cards — `feature/admin-dashboard`) |
| 2 | **Manage Interns** | ✅ Done | Clement | Clement (CRUD, search, filter, CSV export) · Victor (addIntern→signup, loading fix, mobile fix) |
| 2a | ↳ Edit Modal | ✅ Done | Clement | Clement |
| 3 | **Monitor Attendance** | ❌ Not Started | Yuan | — |
| 4 | **Manage Tasks** | 🔶 Static UI Only | Yuan | Yuan (card layout, filters, search) · Clement (merged PR) |
| 4a | ↳ Create Task Modal | ❌ Not Started | Yuan | — |
| 5 | **Manage Admins** | ❌ Not Started | Clement | — |
| 5a | ↳ Add Admin Modal | ❌ Not Started | Clement | — |
| 6 | **Manage Supervisors** | � Static UI Only | Angelito | Angelito (header, stats cards, search/filter — merged from `feature/manage-supervisors`) |
| 6a | ↳ Add Supervisor Modal | ❌ Not Started | Angelito | — |
| 7 | **Reports** | ❌ Not Started | Clement | — |
| 7a | ↳ Weekly Summary | ❌ Not Started | Clement | — |
| 7b | ↳ Monthly Summary | ❌ Not Started | Clement | — |
| 7c | ↳ Full Report | ❌ Not Started | Clement | — |
| 8 | **Announcements** | ✅ Done | Clement | Clement (full CRUD, Supabase connected) · Victor (createAnnouncement backend, filter fix) |
| 8a | ↳ Create Announcement Modal | ✅ Done | Clement | Clement |
| 9 | **Settings** | ❌ Not Started | Kevin | — |

---

### SUPERVISOR PANEL

| # | Page / Feature | Status | Assigned | Contributor(s) |
|---|---|---|---|---|
| 1 | **Supervisor Dashboard** | ✅ Done | Jay | Jay (live Supabase — active interns, pending approvals, live stats) |
| 2 | **Approve Tasks** | 🔶 Static UI Only | Jay + Victor (BE) | Jay (tab UI: To Review / Approved / Rejected — hardcoded sample data) |
| 2a | ↳ To Be Reviewed Tab | 🔶 Static UI Only | Jay + Victor (BE) | Jay |
| 2b | ↳ Approved Tab | 🔶 Static UI Only | Jay + Victor (BE) | Jay |
| 2c | ↳ Rejected Tab | 🔶 Static UI Only | Jay + Victor (BE) | Jay |
| 3 | **Evaluations** | 🔶 Static UI Only | Jay + Victor (BE) | Jay (UI shell with summary cards — data array always empty, no fetch) |
| 4 | **Feedback** | 🔶 Static UI Only | Jay + Victor (BE) | Jay (View Modal + Edit Modal — dummy static data) |
| 4a | ↳ View Modal | 🔶 Static UI Only | Jay + Victor (BE) | Jay |
| 4b | ↳ Edit Modal | 🔶 Static UI Only | Jay + Victor (BE) | Jay |
| 5 | **Settings** | 🔶 Static UI Only | Kevin + Victor (BE) | Jay (basic profile form — static placeholder values, no save) |

---

## DETAILED NOTES PER PAGE

### INTERN PORTAL

#### 1. Dashboard 🔶 Partial
- [src/pages/student/StudentDashboard.tsx](src/pages/student/StudentDashboard.tsx) — 305 lines
- **Judito** built the initial UI (card layout, animation, welcome section).
- **Clement** wired announcements to Supabase via `announcementService`. Announcements section is ✅ live.
- **Stat cards are fully hardcoded:** Tasks Completed = `24`, Hours Logged = `128 hrs`, Internship Days = `45` — none fetch from Supabase.
- **Todo (Victor - BE):** Add `fetchTaskStats(userId)` to `taskServices.ts` (count of completed tasks for intern) · Add `fetchTotalHours(userId)` to `attendanceServices.ts` (sum of `total_hours` for intern) · Expose OJT end date from `users` table for days-remaining calc.
- **Todo (Judito - FE):** Wire the 3 stat cards to the service functions Victor provides.

#### 2. Task List ❌
- [src/pages/student/TaskList.tsx](src/pages/student/TaskList.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `fetchTasksByIntern(userId)` to `taskServices.ts` (fetch all tasks where `assigned_to = userId`) · Add `updateTaskStatus(taskId, status)` for status changes.
- **Todo (Judito - FE):** Build tabbed view (All / In Progress / Completed / Overdue) consuming Victor's service functions. Wire status change actions per card.

#### 3. Time Log ❌
- [src/pages/student/DailyLogs.tsx](src/pages/student/DailyLogs.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `clockIn(userId)` and `clockOut(attendanceId)` to `attendanceServices.ts` (insert/update `attendance` table) · Add `fetchAttendanceLogs(userId)` to retrieve the intern's log history.
- **Todo (Judito - FE):** Build Clock In/Out button with elapsed timer. Render daily log history table from Victor's service functions.

#### 4. Performance Feedback ❌
- [src/pages/student/PerformanceFeedback.tsx](src/pages/student/PerformanceFeedback.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `fetchEvaluationsByIntern(userId)` to `evaluationService.ts` (fetch rows where `intern_id = userId`, join supervisor name from `users`).
- **Todo (Kevin - FE):** Build read-only list view consuming Victor's service function. Display score, feedback text, supervisor name, and date per evaluation.

#### 5. Settings ❌
- [src/pages/student/Settings.tsx](src/pages/student/Settings.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `fetchUserProfile(userId)` and `updateUserProfile(userId, data)` to `userServices.ts` (read/write `users` table) · Ensure avatar upload via Supabase Storage is accessible.
- **Todo (Kevin - FE):** Build profile form (name, avatar) and password change section wired to Victor's service functions and `authService.updatePassword`.

---

### ADMIN PANEL

#### 1. Admin Dashboard 🟡
- [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx) — 280 lines
- **Angelito** built: Chart.js bar chart (hardcoded data), stat cards with animations, activity section, card hover effects.
- Branch: `feature/admin-dashboard` — **not yet merged to main**.
- **Todo (Victor - BE):** Add `fetchAdminDashboardStats()` to `userServices.ts` (total interns, active interns, supervisors count) · Add `fetchMonthlySignups()` for the Chart.js bar chart data.
- **Todo (Angelito - FE):** Merge branch. Wire stat cards and chart to Victor's service functions.

#### 2. Manage Interns ✅
- [src/pages/admin/ManageInterns.tsx](src/pages/admin/ManageInterns.tsx) — 694 lines
- **Clement:** Full CRUD, search, filter, sort, archive toggle, CSV export. Edit Modal included.
- **Victor:** addIntern→Supabase `signUp` integration, search filter bug fix (ITRK-BG0012), loading state fix, mobile min-width fix.
- No remaining backend work.

#### 3. Monitor Attendance ❌
- [src/pages/admin/MonitorAttendance.tsx](src/pages/admin/MonitorAttendance.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `fetchAllAttendance(filters)` to `attendanceServices.ts` (paginated query on `attendance` table joined with `users`, supports filtering by date, intern, status).
- **Todo (Yuan - FE):** Build attendance table UI consuming Victor's service function. Wire date picker, intern name, and status filter controls.

#### 4. Manage Tasks 🔶 + Create Task Modal ❌
- [src/pages/admin/ManageTasks.tsx](src/pages/admin/ManageTasks.tsx) — 308 lines
- **Yuan:** Card layout, priority badges, filter dropdowns (due date, priority, status), search bar — built with hardcoded `sampleTasks` array. 3 commit progression.
- **Clement** merged Yuan's PR.
- "+ Create Task" button renders but opens no modal.
- **Todo (Victor - BE):** Add `fetchTasks(filters)` to `taskServices.ts` (query `tasks` table with optional filters for due date, priority, status, search) · Add `createTask(data)` · Add `updateTask(taskId, data)` · Add `deleteTask(taskId)`.
- **Todo (Yuan - FE):** Replace `sampleTasks` with Victor's `fetchTasks()`. Build Create Task Modal wired to `createTask()`. Wire filter dropdowns and search to query parameters.

#### 5. Manage Admins ❌
- [src/pages/admin/ManageAdmins.tsx](src/pages/admin/ManageAdmins.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Add `fetchAdmins()` to `userServices.ts` (query `users` table where `role = 'admin'`) · Add `createAdmin(email, password, fullName)` using Supabase Auth `signUp` with role assignment.
- **Todo (Clement - FE):** Build admin list table + Add Admin Modal wired to Victor's service functions.

#### 6. Manage Supervisors �
- [src/pages/admin/ManageSupervisors.tsx](src/pages/admin/ManageSupervisors.tsx) — merged from `feature/manage-supervisors`
- **Angelito** built: placeholder page → header + Add Supervisor button → stats cards (Total/Active/Archived) → search/filter UI. All static, no Supabase. Branch now merged to main.
- **Todo (Victor - BE):** Add `fetchSupervisors()` to `userServices.ts` (query `users` where `role = 'supervisor'`) · Add `createSupervisor(email, password, fullName)` via Supabase Auth `signUp` · Add `archiveSupervisor(userId)` to toggle status.
- **Todo (Angelito - FE):** Build Add Supervisor Modal. Replace static list with Victor's `fetchSupervisors()`. Wire stats cards to live counts.

#### 7. Reports ❌
- [src/pages/admin/Reports.tsx](src/pages/admin/Reports.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Create `reportService.ts` with `fetchWeeklySummary(weekStart)` (aggregate attendance hours + task completions per intern for a given week) · `fetchMonthlySummary(month, year)` · `fetchFullReport(filters)` returning raw rows for PDF/CSV export.
- **Todo (Clement - FE):** Build Weekly/Monthly/Full Report views consuming Victor's service. Add PDF/CSV export buttons.

#### 8. Announcements ✅
- [src/pages/admin/Announcements.tsx](src/pages/admin/Announcements.tsx) — 366 lines
- **Clement:** Full UI, Create Announcement Modal, connected to Supabase.
- **Victor:** `createAnnouncement` backend logic, announcement search/filter fix (`backend/announcement-search-filter` branch).
- No remaining work.

#### 9. Settings ❌
- [src/pages/admin/Settings.tsx](src/pages/admin/Settings.tsx) — 19 lines (stub)
- **Todo (Victor - BE):** Reuse `fetchUserProfile(userId)` and `updateUserProfile(userId, data)` from `userServices.ts` (same functions as intern settings).
- **Todo (Kevin - FE):** Build admin profile form and password change section wired to Victor's service functions.

---

### SUPERVISOR PANEL

#### 1. Supervisor Dashboard ✅
- [src/pages/supervisor/SupervisorDashboard.tsx](src/pages/supervisor/SupervisorDashboard.tsx) — 112 lines
- **Jay:** Fetches live stats from Supabase: active interns, logs to review, pending approvals, feedback requests. Loading state handled cleanly.

#### 2. Approve Tasks 🔶
- [src/pages/supervisor/SupervisorApprovals.tsx](src/pages/supervisor/SupervisorApprovals.tsx) — 163 lines
- **Jay:** Tab UI (To Review / Approved / Rejected) built with hardcoded `sampleTasks`.
- **Todo (Victor - BE):** Add `fetchTasksForReview(supervisorId)` to `taskServices.ts` (fetch tasks where intern's supervisor = supervisorId, grouped by status) · Add `approveTask(taskId)` and `rejectTask(taskId)` to update task status.
- **Todo (Jay - FE):** Replace `sampleTasks` with Victor's `fetchTasksForReview()`. Wire Approve/Reject buttons to Victor's action functions.

#### 3. Evaluations 🔶
- [src/pages/supervisor/Evaluations.tsx](src/pages/supervisor/Evaluations.tsx) — 109 lines
- **Jay:** UI shell with 3 summary cards. `evaluations` array is always empty (`useState([])`), so cards always show 0.
- **Todo (Victor - BE):** Add `fetchEvaluationsBySupervisor(supervisorId)` to `evaluationService.ts` (fetch rows where `supervisor_id = supervisorId`) · Add `createEvaluation(data)` to insert a new evaluation record.
- **Todo (Jay - FE):** Replace empty array with Victor's `fetchEvaluationsBySupervisor()`. Build evaluation submission modal wired to `createEvaluation()`.

#### 4. Feedback 🔶
- [src/pages/supervisor/FeedbackDashboard.tsx](src/pages/supervisor/FeedbackDashboard.tsx) — 241 lines
- **Jay:** View Modal + Edit Modal UI fully built with dummy static `dummyTasks` array.
- **Todo (Victor - BE):** Add `fetchFeedback(supervisorId)` to `evaluationService.ts` (fetch evaluations with intern details joined) · Add `updateFeedback(evaluationId, data)` for the edit modal save action.
- **Todo (Jay - FE):** Replace `dummyTasks` with Victor's `fetchFeedback()`. Wire Edit Modal save to `updateFeedback()`.

#### 5. Settings 🔶
- [src/pages/supervisor/Settings.tsx](src/pages/supervisor/Settings.tsx) — 164 lines
- **Jay:** Basic profile form with static placeholder values. No data load on mount, no save action.
- **Todo (Victor - BE):** Reuse `fetchUserProfile(userId)` and `updateUserProfile(userId, data)` from `userServices.ts` (same functions as intern/admin settings).
- **Todo (Kevin - FE):** Load user data on mount using Victor's `fetchUserProfile()`. Wire Save button to `updateUserProfile()` and `authService.updatePassword`.

---

## PRIORITY ORDER FOR REMAINING WORK

### 🔴 High Priority (Core or Blocking)

**Victor (BE) — Service layer (do first so FE can connect):**
- `taskServices.ts`: `fetchTasksByIntern`, `fetchTasksForReview`, `fetchTasks(filters)`, `createTask`, `updateTask`, `updateTaskStatus`, `approveTask`, `rejectTask`, `deleteTask`
- `attendanceServices.ts`: `clockIn`, `clockOut`, `fetchAttendanceLogs`, `fetchTotalHours`, `fetchAllAttendance(filters)`
- `userServices.ts`: `fetchUserProfile`, `updateUserProfile`, `fetchAdmins`, `createAdmin`, `fetchSupervisors`, `createSupervisor`, `archiveSupervisor`, `fetchAdminDashboardStats`, `fetchMonthlySignups`
- `evaluationService.ts`: `fetchEvaluationsByIntern`, `fetchEvaluationsBySupervisor`, `createEvaluation`, `fetchFeedback`, `updateFeedback`
- `reportService.ts` (new file): `fetchWeeklySummary`, `fetchMonthlySummary`, `fetchFullReport`

**FE tasks (unblock after Victor's services are ready):**
1. **Merge Angelito's Admin Dashboard branch** (`feature/admin-dashboard`) → Clement review & merge
2. **Intern Task List** — Judito (FE) + Victor (BE: `fetchTasksByIntern`, `updateTaskStatus`)
3. **Intern Time Log / Clock In-Out** — Judito (FE) + Victor (BE: `clockIn`, `clockOut`, `fetchAttendanceLogs`)
4. **Admin Monitor Attendance** — Yuan (FE) + Victor (BE: `fetchAllAttendance`)
5. **Manage Tasks → Supabase + Create Task Modal** — Yuan (FE) + Victor (BE: `fetchTasks`, `createTask`)
6. **Manage Admins + Add Admin Modal** — Clement (FE) + Victor (BE: `fetchAdmins`, `createAdmin`)
7. **Manage Supervisors → Add Modal + Supabase** — Angelito (FE) + Victor (BE: `fetchSupervisors`, `createSupervisor`)
8. **Supervisor Approve Tasks → Connect to Supabase** — Jay (FE) + Victor (BE: `fetchTasksForReview`, `approveTask`, `rejectTask`)

### 🟡 Medium Priority (Feature Complete)
9. **Admin Dashboard → Connect live data** — Angelito (FE) + Victor (BE: `fetchAdminDashboardStats`, `fetchMonthlySignups`)
10. **Supervisor Evaluations → Connect + submission form** — Jay (FE) + Victor (BE: `fetchEvaluationsBySupervisor`, `createEvaluation`)
11. **Supervisor Feedback → Connect to Supabase** — Jay (FE) + Victor (BE: `fetchFeedback`, `updateFeedback`)
12. **Intern Performance Feedback** — Kevin (FE) + Victor (BE: `fetchEvaluationsByIntern`)
13. **Settings pages (all roles)** — Kevin (FE) + Victor (BE: `fetchUserProfile`, `updateUserProfile`)
14. **Intern Dashboard stat boxes** — Judito (FE) + Victor (BE: `fetchTaskStats`, `fetchTotalHours`)

### 🟢 Lower Priority (Polish & Advanced)
15. **Reports → Weekly, Monthly, Full Report + PDF/CSV export** — Clement (FE) + Victor (BE: `reportService.ts`)
16. **Admin Dashboard chart → real data** — Angelito (FE) + Victor (BE: `fetchMonthlySignups`)

---

## FILE REFERENCE MAP

```
src/pages/
├── student/
│   ├── StudentDashboard.tsx    🔶 Partial      (announcements live, stat boxes hardcoded)
│   ├── TaskList.tsx            ❌ Not Started  (Judito)
│   ├── DailyLogs.tsx           ❌ Not Started  (Judito — Time Log)
│   ├── PerformanceFeedback.tsx ❌ Not Started  (Kevin)
│   └── Settings.tsx            ❌ Not Started  (Kevin)
├── admin/
│   ├── AdminDashboard.tsx      🟡 Branch only  (Angelito — not merged)
│   ├── ManageInterns.tsx       ✅ Done         (Clement + Victor)
│   ├── MonitorAttendance.tsx   ❌ Not Started  (Yuan)
│   ├── ManageTasks.tsx         🔶 Static UI    (Yuan — no modal, no Supabase)
│   ├── ManageAdmins.tsx        ❌ Not Started  (Clement)
│   ├── ManageSupervisors.tsx   � Static UI    (Angelito — merged, no modal, no Supabase)
│   ├── Reports.tsx             ❌ Not Started  (Clement)
│   ├── Announcements.tsx       ✅ Done         (Clement + Victor)
│   └── Settings.tsx            ❌ Not Started  (Kevin)
└── supervisor/
    ├── SupervisorDashboard.tsx ✅ Done         (Jay — live Supabase)
    ├── SupervisorApprovals.tsx 🔶 Static UI    (Jay — no backend)
    ├── Evaluations.tsx         🔶 Static UI    (Jay — always empty)
    ├── FeedbackDashboard.tsx   🔶 Static UI    (Jay — dummy data)
    └── Settings.tsx            🔶 Static UI    (Jay — placeholder values)
```

---

## QUICK STATS

| Status | Count |
|---|---|
| ✅ Done (Supabase connected) | 3 pages (ManageInterns, Announcements, SupervisorDashboard) |
| 🟡 In Branch (not merged to main) | 1 page (AdminDashboard) |
| 🔶 Static UI / Partial | 7 pages (StudentDashboard, ManageTasks, ManageSupervisors, SupervisorApprovals, Evaluations, FeedbackDashboard, Supervisor Settings) |
| ❌ Not Started | 12 pages/features |
| **Total tracked** | **23** |
