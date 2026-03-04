import { apiClient } from './apiClient';
import type { Tasks } from '../types/database.types';

export const taskService = {
    async getTasks(signal?: AbortSignal): Promise<Tasks[]> {
        const response = await apiClient.get<{ data: Tasks[] }>('/tasks', { signal });
        return response.data.data;
    },

    async getMyTasks(signal?: AbortSignal): Promise<Tasks[]> {
        const response = await apiClient.get<{ data: Tasks[] }>('/tasks/my-tasks', { signal });
        return response.data.data;
    },

    async getSupervisorTasks(signal?: AbortSignal): Promise<Tasks[]> {
        const response = await apiClient.get<{ data: Tasks[] }>('/tasks/supervisor', { signal });
        return response.data?.data ?? [];
    },

    async approveTask(id: number): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}/approve`);
        return response.data.data;
    },

    async supervisorRejectTask(id: number, rejection_reason: string): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}/supervisor-reject`, { rejection_reason });
        return response.data.data;
    },

    async requestRevisionTask(id: number, revision_reason: string, revision_category: string): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}/request-revision`, { revision_reason, revision_category });
        return response.data.data;
    },

    async createTask(payload: {
        title: string;
        description?: string;
        due_date: string;
        priority: string;
        intern_ids: number[];
    }): Promise<Tasks> {
        const response = await apiClient.post<{ data: Tasks }>('/tasks', payload);
        return response.data.data;
    },

    async updateTask(id: number, updates: Partial<{
        title: string;
        description: string;
        due_date: string;
        priority: string;
        status: string;
        intern_ids: number[];
    }>): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}`, updates);
        return response.data.data;
    },

    async updateStatus(id: number, status: string): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}/status`, { status });
        return response.data.data;
    },

    async rejectTask(id: number, rejection_reason: string): Promise<Tasks> {
        const response = await apiClient.put<{ data: Tasks }>(`/tasks/${id}/reject`, { rejection_reason });
        return response.data.data;
    },
};
