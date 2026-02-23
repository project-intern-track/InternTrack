import { z } from "zod";

// ========================
// Zod Validation Schemas
// ========================

// Users Schema (for creating new users — excludes id & created_at)
export const usersSchema = z.object({
    email: z.string().email("Invalid email address"),
    full_name: z.string().min(1, "Full name is required"),
    avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal('')),
    role: z.enum(["admin", "supervisor", "intern"]),
    ojt_role: z.string().optional(),
    ojt_id: z.number().optional(),
    start_date: z.string().optional(),
    required_hours: z.number().optional(),
    ojt_type: z.enum(["required", "voluntary"]).optional(),
    status: z.enum(["active", "archived"]).optional(),
});

// Tasks Schema (for creating new tasks — excludes id & created_at)
export const taskSchema = z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().min(1, "Task description is required"),
    assigned_to: z.string().uuid("Invalid assigned_to user ID"),
    status: z.enum(["todo", "in-progress", "review", "done"]),
    priority: z.enum(["low", "medium", "high"]),
    due_date: z.string().min(1, "Due date is required"),
    created_by: z.string().uuid("Invalid created_by user ID"),
});

// Attendance Schema (for creating new attendance records — excludes id & created_at)
export const attendanceSchema = z.object({
    user_id: z.string().uuid("Invalid user ID"),
    date: z.string().min(1, "Date is required"),
    time_in: z.string().min(1, "Time in is required"),
    time_out: z.string().optional(),
    total_hours: z.number().optional(),
    status: z.enum(["present", "absent", "late", "excused"]),
});

// Announcement Schema (for creating new announcements — excludes id & created_at)
export const announcementSchema = z.object({
    title: z.string().min(1, "Announcement title is required"),
    content: z.string().min(1, "Announcement content is required"),
    priority: z.enum(["low", "medium", "high"]),
    created_by: z.string().uuid("Invalid created_by user ID"),
    visibility: z.enum(["all", "admin", "supervisor", "intern"]),
});

// Evaluation Schema (for creating new evaluations — excludes id & created_at)
export const evaluationSchema = z.object({
    intern_id: z.string().uuid("Invalid intern ID"),
    supervisor_id: z.string().uuid("Invalid supervisor ID"),
    score: z.number().min(1, "Score must be at least 1").max(10, "Score must be at most 10"),
    feedback: z.string().min(1, "Feedback is required"),
    evaluation_date: z.string().min(1, "Evaluation date is required"),
});
