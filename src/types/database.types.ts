// Aliases for database types
export type UserRole = 'admin' | 'supervisor' | 'intern';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';


// ===============
// Database Tables
// ===============
export interface Users {

    id: string; // UUID, Primary Key (PK), references `auth.users.id`
    email: string; // Must Be Unique
    full_name: string;
    avatar_url: string;
    role: UserRole;
    created_at: string; // ISO Date String, Default to current timestamp on creation
}

export interface Tasks {

    id: string; // UUID, PK
    title: string;
    description: string;
    assigned_to: string; // UUID, Foreign Key referencing `users.id`
    status : TaskStatus;
    priority: TaskPriority;
    due_date: string; // ISO Date String
    created_by: string; // UUID, Foreign Key referencing `users.id`
    created_at: string; // ISO Date String, Default to current timestamp on creation

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
    created_by: string; // UUID, FK Reference to `users.id`
    visibility: 'all' | UserRole; // Array of UserRoles that can see this announcement
    created_at: string; // ISO Date String, Default to current timestamp on creation

}

export interface Evaluation {

    id: string; //UUID, PK
    intern_id: string; //UUID, FK reference to 'users.id' where role = 'student'
    supervisor_id: string; // UUID, FK reference to 'users.id' where role = 'supervisor'
    score: number; // Int Range from 1-10 or 1-5
    feedback: string;
    evaluation_date: string; // ISO Date String
    created_at: string; // ISO Date String, Default to current timestamp on creation

}
