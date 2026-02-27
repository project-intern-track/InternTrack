// ========
// IMPORTS
// ========
// TODO: Migrate to apiClient — Supabase has been removed.
// import { apiClient } from "./apiClient";
import { attendanceSchema } from "./validation";
import type { Attendance } from "../types/database.types";


// Attendance Services Functions
// TODO: Each method below needs a corresponding Laravel backend endpoint.
// Once the backend routes/controllers are created, replace the placeholder
// implementations with apiClient calls (e.g. apiClient.get('/attendance')).
export const attendanceService = {

    async getAttendance(): Promise<Attendance[]> {
        // TODO: Replace with apiClient.get('/attendance')
        console.warn('attendanceService.getAttendance() not yet migrated to Laravel backend.');
        return [];
    },

    async createAttendance(newAttendanceData: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> {
        const validation = attendanceSchema.safeParse(newAttendanceData);
        if (!validation.success) {
            throw new Error(`Invalid Attendance Data: ${validation.error.message}`);
        }
        // TODO: Replace with apiClient.post('/attendance', newAttendanceData)
        throw new Error('attendanceService.createAttendance() not yet migrated to Laravel backend.');
    },

    async clockIn(userId: string): Promise<Attendance> {
        // TODO: Replace with apiClient.post('/attendance/clock-in', { user_id: userId })
        void userId;
        throw new Error('attendanceService.clockIn() not yet migrated to Laravel backend.');
    },

    async clockOut(attendanceId: string, _timeInString: string): Promise<Attendance> {
        // TODO: Replace with apiClient.post(`/attendance/${attendanceId}/clock-out`)
        void attendanceId;
        throw new Error('attendanceService.clockOut() not yet migrated to Laravel backend.');
    }

}
