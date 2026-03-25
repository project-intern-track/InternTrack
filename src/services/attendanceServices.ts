import { apiClient } from "./apiClient";
import type { Attendance } from "../types/database.types";

export interface AttendanceStats {
    total_hours: number;
    today_hours: number;
    week_hours: number;
    total_entries: number;
}

export interface ClockOutResult {
    data: Attendance;
    capped: boolean;
    cross_midnight: boolean;
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
        const data = response.data;
        if (
            !data ||
            (typeof data === "object" && Object.keys(data).length === 0)
        ) {
            return null;
        }
        return data;
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

    /** Clock in for today. Requires the intern's OJT ID for verification. */
    async clockIn(ojtId: string): Promise<Attendance> {
        const response = await apiClient.post("/attendance/clock-in", {
            ojt_id: ojtId,
        });
        // Backend returns { data: Attendance } or { message, data: Attendance }
        return response.data?.data ?? response.data;
    },

    /** Clock out — records current server time, caps at 8 h, handles cross-midnight. */
    async clockOut(): Promise<ClockOutResult> {
        const response = await apiClient.post("/attendance/clock-out");
        // Backend returns { data, capped, cross_midnight }
        if (
            response.data && "data" in response.data &&
            "capped" in response.data
        ) {
            return response.data as ClockOutResult;
        }
        return { data: response.data, capped: false, cross_midnight: false };
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

    /** Admin / Supervisor: update an existing attendance record by id. */
    async update(id: string | number, payload: {
        user_id: string | number;
        date: string;
        time_in: string;
        time_out?: string;
        status?: "present" | "absent" | "late" | "excused";
    }): Promise<Attendance> {
        const response = await apiClient.put(`/attendance/${id}`, payload);
        return response.data;
    },

    /** Delete an attendance record by ID. */
    async deleteAttendance(id: string | number): Promise<void> {
        await apiClient.delete(`/attendance/${id}`);
    },
};
