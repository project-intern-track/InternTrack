// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { announcementSchema } from "./validation";
import type { Announcement } from "../types/database.types"; // Announcement Interface From Database Types



// Announcement Services Functions
export const announcementService = {

    async getAnnouncements () {

        const { data, error } = await supabase
            .from('announcements')
            .select("*");

        if (error) throw new Error(`Error Fetching Announcements: ${error.message}`);
        return data;
    },


    /**
     * Create Announcement with appropriate data validation
     * Updated Function
     */
    async createAnnouncement (
        content: {
            title: string;
            content: string;
            created_by: string;
            visibility: 'all' | 'admin' | 'supervisor' | 'intern';
            // Possibility to add created_at time ISO string

        }) : Promise<Announcement> {

        const validation = announcementSchema.safeParse(content);

        if (!validation.success) {
            throw new Error(`Invalid Announcement Data: ${validation.error.message}`);
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert(content)
            .select()
            .single();

        if (error) throw new Error(`Error Creating Announcement: ${error.message}`);
        return data as Announcement;
    }

}