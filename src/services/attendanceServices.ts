import { apiClient } from "./apiClient";
import type { Attendance } from "../types/database.types";

export interface AttendanceStats {
    total_hours: number;
    today_hours: number;
    week_hours: number;
    total_entries: number;
}

export const attendanceService = {
    /** Get all attendance records for the authenticated user (or all, for admin/supervisor). */
    async getAttendance(
        params?: { user_id?: string | number; from?: string; to?: string },
    ): Promise<Attendance[]> {
        const response = await apiClient.get("/attendance", { params });
        return response.data ?? [];
    },

    /** Get aggregated stats (total_hours, today_hours, week_hours, total_entries). */
    async getStats(userId?: string | number): Promise<AttendanceStats> {
        const params = userId ? { user_id: userId } : {};
        const response = await apiClient.get("/attendance/stats", { params });
        return response.data;
    },

    /** Get today's attendance record for the authenticated user (or null). */
    async getToday(): Promise<Attendance | null> {
        const response = await apiClient.get("/attendance/today");
        return response.data ?? null;
    },

    /**
     * Self-log an attendance entry (intern) — date + time_in + time_out all at once.
     * Upserts: if a record for that date already exists, it gets updated.
     */
    async log(
        entry: { date: string; time_in: string; time_out: string },
    ): Promise<Attendance> {
        const response = await apiClient.post("/attendance/log", entry);
        return response.data;
    },

    /** Clock in for today — records current server time as time_in. */
    async clockIn(): Promise<Attendance> {
        const response = await apiClient.post("/attendance/clock-in");
        return response.data?.data ?? response.data;
    },

    /** Clock out for today — records current server time as time_out and computes hours. */
    async clockOut(): Promise<Attendance> {
        const response = await apiClient.post("/attendance/clock-out");
        return response.data?.data ?? response.data;
    },

    /** Admin / Supervisor: manually store an attendance record for any user. */
    async store(payload: {
        user_id: string | number;
        date: string;
        time_in: string;
        time_out?: string;
        status?: "present" | "absent" | "late" | "excused";
    }): Promise<Attendance> {
        const response = await apiClient.post("/attendance", payload);
        return response.data;
    },

    /** Delete an attendance record by ID. */
    async deleteAttendance(id: string | number): Promise<void> {
        await apiClient.delete(`/attendance/${id}`);
    },
};
