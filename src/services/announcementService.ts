// ========
// IMPORTS
// ========
// TODO: Migrate to apiClient — Supabase has been removed.
// import { apiClient } from "./apiClient";
import { announcementSchema } from "./validation";
import type { Announcement, AnnouncementPriority, UserRole } from "../types/database.types";

// Announcement Services Functions
// TODO: Each method below needs a corresponding Laravel backend endpoint.
// Once the backend routes/controllers are created, replace the placeholder
// implementations with apiClient calls (e.g. apiClient.get('/announcements')).
export const announcementService = {

    /**
     * Fetches all announcements from the database
     */
    async getAnnouncements(): Promise<Announcement[]> {
        // TODO: Replace with apiClient.get('/announcements')
        console.warn('announcementService.getAnnouncements() not yet migrated to Laravel backend.');
        return [];
    },

    /**
     * Validates and creates a new announcement
     */
    async createAnnouncement(newAnnouncementData: {
        title: string;
        content: string;
        priority: AnnouncementPriority;
        created_by: string;
        visibility: 'all' | UserRole;
    }): Promise<Announcement> {
        const validation = announcementSchema.safeParse(newAnnouncementData);
        if (!validation.success) {
            throw new Error(`Invalid Announcement Data: ${validation.error.message}`);
        }
        // TODO: Replace with apiClient.post('/announcements', newAnnouncementData)
        throw new Error('announcementService.createAnnouncement() not yet migrated to Laravel backend.');
    }
}