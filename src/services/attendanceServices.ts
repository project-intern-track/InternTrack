// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { attendanceSchema } from "./validation";
import type { Attendance } from "../types/database.types"; // Attendance Interface From Database Types


// Attendance Services Functions
export const attendanceService = {

    async getAttendance () {

        const {data, error} = await supabase
            .from('attendance')
            .select('*');

        if (error) throw new Error(`Error Fetching Attendance: ${error.message}`);
        return data;

    },


    async createAttendance (newAttendanceData: Omit<Attendance, 'id' | 'created_at'>) {

        const validation = attendanceSchema.safeParse(newAttendanceData);

        if (!validation.success) {
            throw new Error(`Invalid Attendance Data: ${validation.error.message}`);
        }

        const { data, error } = await supabase
            .from('attendance')
            .insert(newAttendanceData)
            .select()
            .single();

        // Catch ad Logs errors
        if (error) throw new Error(`Error Creating Attendance: ${error.message}`);
        return data as Attendance;


    },

    async clockIn (userId: string) {

        const { data, error } = await supabase
            .from('attendance')
            .insert(
                {
                    user_id: userId, // FK Reference to 'users.id'
                    time_in: new Date().toISOString(), // Current Timestamp
                    status: 'present' // Default Status, can be updated later based on time_in
                }
            )

            .select()
            .single();

        if (error) throw new Error(`Error Clocking In: ${error.message}`);
        return data as Attendance;

    },

    async clockOut (attendanceId: string, timeInString: string) {
        // Fetch the existing attendance record to calculate total hours
        const timeOut = new Date().toISOString();

        
        // Calculate Total Hours
        const timeIn = new Date(timeInString); // Calls The Time In Strinf From Specific Attendance Record
        const timeOutDate = new Date(timeOut);
        const totalHours = (timeOutDate.getTime() - timeIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours

        const {data, error} = await supabase
            .from('attendance')
            .update({
                time_out: Number(totalHours.toFixed(2)), // Ensure Total Hours is Rounded to 2 Decimal Places
                total_hours: totalHours
            })
            .eq('id', attendanceId) // PK Reference for the specific attendance record
            .select()
            .single();

        if (error) throw new Error(`Error Clocking Out: ${error.message}`);
        return data as Attendance;

    }

}
