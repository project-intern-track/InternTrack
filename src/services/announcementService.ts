import { apiClient } from './apiClient';
import { announcementSchema } from './validation';
import type { Announcement, AnnouncementPriority, UserRole } from '../types/database.types';

export const announcementService = {
    async getAnnouncements(signal?: AbortSignal): Promise<Announcement[]> {
        const response = await apiClient.get<{ data: Announcement[] }>('/announcements', { signal });
        return response.data?.data ?? [];
    },

    async createAnnouncement(payload: {
        title: string;
        content: string;
        priority: AnnouncementPriority;
        created_by: string;
        visibility: 'all' | UserRole;
    }): Promise<Announcement> {
        const validation = announcementSchema.safeParse(payload);
        if (!validation.success) {
            throw new Error(`Invalid Announcement Data: ${validation.error.message}`);
        }
        const response = await apiClient.post<{ data: Announcement }>('/announcements', {
            title: payload.title,
            content: payload.content,
            priority: payload.priority,
        });
        return response.data.data;
    },
};
