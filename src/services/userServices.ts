import { apiClient } from "./apiClient";
import { usersSchema } from "./validation";
import type { Users } from "../types/database.types";

// ========================
// User Services Functions (Laravel API)
// ========================
export const userService = {
    async getUsers() {
        try {
            const response = await apiClient.get("/users");
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Users: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async createUser(newUserData: Omit<Users, "id" | "created_at">) {
        const validation = usersSchema.safeParse(newUserData);

        if (!validation.success) {
            throw new Error(`Invalid User Data: ${validation.error.message}`);
        }

        try {
            const response = await apiClient.post("/users", newUserData);
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Creating User: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Fetch all interns with optional filters
    async fetchInterns(filters?: {
        search?: string;
        role?: string;
        status?: string;
        sortDirection?: "asc" | "desc";
    }) {
        try {
            const params = new URLSearchParams();
            params.append("role", "intern");

            if (filters?.search) params.append("search", filters.search);
            // Map frontend concept "role" back to "ojt_role" endpoint parameter
            if (filters?.role && filters.role !== "all") {
                params.append("ojt_role", filters.role);
            }
            if (filters?.status && filters.status !== "all") {
                params.append("status", filters.status);
            }
            if (filters?.sortDirection) {
                params.append("sortDirection", filters.sortDirection);
            }

            const response = await apiClient.get(`/users?${params.toString()}`);
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Interns: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Get stats for the Manage Interns page
    async getInternStats() {
        try {
            const response = await apiClient.get("/users/stats?role=intern");
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error Fetching Intern Stats: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Update an intern's profile
    async updateIntern(internId: string, updates: Partial<Users>) {
        try {
            const response = await apiClient.put(`/users/${internId}`, updates);
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Updating Intern: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Update any user's profile
    async updateUser(userId: string, updates: Partial<Users>) {
        try {
            const response = await apiClient.put(`/users/${userId}`, updates);
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Updating User: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Archive or restore an intern
    async toggleArchiveIntern(internId: string, currentStatus: string) {
        try {
            const newStatus = currentStatus === "active"
                ? "archived"
                : "active";
            const response = await apiClient.put(`/users/${internId}`, {
                status: newStatus,
            });
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Archiving Intern: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Get all unique OJT roles for filter dropdown
    async getOjtRoles() {
        try {
            const response = await apiClient.get("/users/ojt-roles");
            return response.data as string[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching OJT Roles: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async getProfile(userId: string) {
        try {
            const response = await apiClient.get(`/users/${userId}`);
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Fetching Profile: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Get stats for the Admin Dashboard
    async getDashboardStats() {
        try {
            const response = await apiClient.get("/users/dashboard-stats");
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error Fetching Dashboard Stats: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Get recent interns for activity feed
    async getRecentInterns(limit: number = 5) {
        try {
            const response = await apiClient.get(
                `/users/interns/recent?limit=${limit}`,
            );
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Recent Interns: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Fetch all admins with optional filters
    async fetchAdmins(filters?: {
        search?: string;
        status?: string;
        dateSort?: "newest" | "oldest";
    }) {
        try {
            const params = new URLSearchParams();
            params.append("role", "admin");
            if (filters?.search) params.append("search", filters.search);
            if (filters?.status && filters.status !== "all") {
                params.append("status", filters.status);
            }
            if (filters?.dateSort) params.append("dateSort", filters.dateSort);

            const response = await apiClient.get(`/users?${params.toString()}`);
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Admins: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Get stats for the Manage Admins page
    async getAdminStats() {
        try {
            const response = await apiClient.get("/users/stats?role=admin");
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error Fetching Admin Stats: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Toggle archive status for an admin
    async toggleArchiveAdmin(adminId: string, currentStatus: string) {
        try {
            const newStatus = currentStatus === "active"
                ? "archived"
                : "active";
            const response = await apiClient.put(`/users/${adminId}`, {
                status: newStatus,
            });
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Archiving Admin: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Fetch interns eligible for admin upgrade
    async fetchInternsForAdminUpgrade() {
        try {
            const response = await apiClient.get(
                "/users?role=intern&status=active",
            );
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Interns for Upgrade: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // Upgrade an intern to admin
    async upgradeInternToAdmin(userId: string) {
        try {
            const response = await apiClient.put(`/users/${userId}`, {
                role: "admin",
            });
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Upgrading Intern: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    // ========================
    // Supervisor Functions
    // ========================

    async fetchSupervisors(filters?: {
        search?: string;
        status?: string;
        dateSort?: "newest" | "oldest";
    }) {
        try {
            const params = new URLSearchParams();
            params.append("role", "supervisor");
            if (filters?.search) params.append("search", filters.search);
            if (filters?.status && filters.status !== "all") {
                params.append("status", filters.status);
            }
            if (filters?.dateSort) params.append("dateSort", filters.dateSort);

            const response = await apiClient.get(`/users?${params.toString()}`);
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Supervisors: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async getSupervisorStats() {
        try {
            const response = await apiClient.get(
                "/users/stats?role=supervisor",
            );
            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error Fetching Supervisor Stats: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async toggleArchiveSupervisor(supervisorId: string, currentStatus: string) {
        try {
            const newStatus = currentStatus === "active"
                ? "archived"
                : "active";
            const response = await apiClient.put(`/users/${supervisorId}`, {
                status: newStatus,
            });
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Archiving Supervisor: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async fetchInternsForSupervisorUpgrade() {
        try {
            const response = await apiClient.get(
                "/users?role=intern&status=active",
            );
            return response.data as Users[];
        } catch (error: any) {
            throw new Error(
                `Error Fetching Interns for Upgrade: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },

    async upgradeInternToSupervisor(userId: string) {
        try {
            const response = await apiClient.put(`/users/${userId}`, {
                role: "supervisor",
            });
            return response.data as Users;
        } catch (error: any) {
            throw new Error(
                `Error Upgrading Intern: ${
                    error.response?.data?.error || error.message
                }`,
            );
        }
    },
};
