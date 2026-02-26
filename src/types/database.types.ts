// Aliases for database types
export type UserRole = 'admin' | 'supervisor' | 'intern';
export type TaskStatus = 'not_started' | 'in_progress' | 'pending' | 'completed' | 'rejected' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type OJTType = 'required' | 'voluntary';
export type UserStatus = 'active' | 'archived';
export type AnnouncementPriority = 'low' | 'medium' | 'high';


// ===============
// Database Tables
// ===============
export interface Users {

    id: string; // UUID, Primary Key (PK), references `auth.users.id`
    email: string; // Must Be Unique
    full_name: string;
    avatar_url: string;
    role: UserRole;
    ojt_role?: string; // OJT role/position (e.g., "Frontend Developer")
    ojt_id?: number; // Auto-generated OJT identifier (e.g., 1101)
    start_date?: string; // ISO Date String, start date of internship
    required_hours?: number; // Total required hours for the internship
    ojt_type?: OJTType; // Type of OJT (required or voluntary)
    status: UserStatus; // active or archived
    created_at: string; // ISO Date String, Default to current timestamp on creation
}

export interface TaskIntern {
    id: number;
    full_name: string;
    avatar_url: string | null;
}

export interface Tasks {
    id: number;
    title: string;
    description: string;
    due_date: string;
    priority: TaskPriority;
    status: TaskStatus;
    rejection_reason: string | null;
    created_by: number;
    created_at: string;
    assigned_interns: TaskIntern[];
    assigned_interns_count: number;
    creator: { id: number; full_name: string } | null;
}

export interface Attendance {

    id: string; // UUID, PK
    user_id: string; //UUID, references 'users.id'
    date: string; // ISO Date String
    time_in: string; // ISO Date String
    time_out: string; // ISO Date String
    total_hours: number; // Float
    status: AttendanceStatus;
    created_at: string; // ISO Date String, Default to current timestamp on creation


}

export interface Announcement {

    id: string; // UUID, PK
    title: string;
    content: string;
    priority: AnnouncementPriority;
    created_by: string; // UUID, FK Reference to `users.id`
    visibility: 'all' | UserRole; // Array of UserRoles that can see this announcement
    created_at: string; // ISO Date String, Default to current timestamp on creation

}

export interface Evaluation {

    id: string; //UUID, PK
    intern_id: string; //UUID, FK reference to 'users.id' where role = 'intern'
    supervisor_id: string; // UUID, FK reference to 'users.id' where role = 'supervisor'
    score: number; // Int Range from 1-10 or 1-5
    feedback: string;
    evaluation_date: string; // ISO Date String
    created_at: string; // ISO Date String, Default to current timestamp on creation

}

// ========================
// Supabase Client Database Type
// ========================
export interface Database {
    public: {
        Tables: {
            users: {
                Row: Users;
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string;
                    avatar_url?: string;
                    role?: UserRole;
                    ojt_role?: string;
                    ojt_id?: number;
                    start_date?: string;
                    required_hours?: number;
                    ojt_type?: OJTType;
                    status?: UserStatus;
                    created_at?: string;
                };
                Update: Partial<Users>;
                Relationships: [];
            };
            tasks: {
                Row: Tasks;
                Insert: {
                    id?: string;
                    title: string;
                    description?: string;
                    assigned_to?: string;
                    status?: TaskStatus;
                    priority?: TaskPriority;
                    due_date?: string;
                    created_by?: string;
                    created_at?: string;
                };
                Update: Partial<Tasks>;
                Relationships: [];
            };
            attendance: {
                Row: Attendance;
                Insert: {
                    id?: string;
                    user_id: string;
                    date?: string;
                    time_in?: string;
                    time_out?: string;
                    total_hours?: number;
                    status?: AttendanceStatus;
                    created_at?: string;
                };
                Update: Partial<Attendance>;
                Relationships: [];
            };
            announcements: {
                Row: Announcement;
                Insert: {
                    id?: string;
                    title: string;
                    content: string;
                    priority?: AnnouncementPriority;
                    created_by?: string;
                    visibility?: 'all' | UserRole;
                    created_at?: string;
                };
                Update: Partial<Announcement>;
                Relationships: [];
            };
            evaluations: {
                Row: Evaluation;
                Insert: {
                    id?: string;
                    intern_id: string;
                    supervisor_id: string;
                    score: number;
                    feedback: string;
                    evaluation_date?: string;
                    created_at?: string;
                };
                Update: Partial<Evaluation>;
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            check_email_exists: {
                Args: {
                    check_email: string;
                };
                Returns: boolean;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
