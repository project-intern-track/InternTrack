// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { announcementSchema } from "./validation";
import type { Announcement } from "../types/database.types"; // Announcement Interface From Database Types



// Announcement Services Functions
export const announcementService = {

    async getAnnouncements() {

        const { data, error } = await supabase
            .from('announcements')
            .select("*");

        if (error) throw new Error(`Error Fetching Announcements: ${error.message}`);
        return data as Announcement[];
    },



    async createAnnouncement(newAnnouncementData: Omit<Announcement, 'id' | 'created_at'>) {

        const validation = announcementSchema.safeParse(newAnnouncementData);

        if (!validation.success) {
            throw new Error(`Invalid Announcement Data: ${validation.error.message}`);
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert(newAnnouncementData)
            .select()
            .single();

        if (error) throw new Error(`Error Creating Announcement: ${error.message}`);
        return data as Announcement;

    }

}