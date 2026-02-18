// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { announcementSchema } from "./validation";
import type { Announcement, AnnouncementPriority, UserRole } from "../types/database.types"; 

// Announcement Services Functions
export const announcementService = {

    /**
     * Fetches all announcements from the database
     */
    async getAnnouncements() : Promise<Announcement[]> {
        const { data, error } = await supabase
            .from('announcements')
            .select("*");

        if (error) throw new Error(`Error Fetching Announcements: ${error.message}`);
        return data as Announcement[];
    },

    /**
     * Validates and creates a new announcement
     * Matches the updated schema with 'intern' visibility and 'priority'
     */
    async createAnnouncement(newAnnouncementData: {
        title: string;
        content: string;
        priority: AnnouncementPriority;
        created_by: string;
        visibility: 'all' | UserRole;
    }) {
        // Run Zod validation against the lead's schema
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