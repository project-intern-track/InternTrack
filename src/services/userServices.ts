// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { usersSchema } from "./validation";
import type { Users } from "../types/database.types"; // User Interface From Database Types


// User Services Functions
export const userService = {


    async getUsers() {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw new Error(`Error Fetching Users: ${error.message}`);
        return data as Users[];
    },

    async createUser(newUserData: Omit<Users, 'id' | 'created_at'>) {

        const validation = usersSchema.safeParse(newUserData);

        if (!validation.success) {
            throw new Error(`Invalid User Data: ${validation.error.message}`);
        }

        const { data, error } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

        if (error) throw new Error(`Error Creating User: ${error.message}`);
        return data as Users;

    },


    // Fetch all interns with optional filters
    async fetchInterns(filters?: {
        search?: string;
        role?: string;
        status?: string;
        sortDirection?: 'asc' | 'desc';
    }) {
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'intern');

        // Apply status filter
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        // Apply role/ojt_role filter
        if (filters?.role && filters.role !== 'all') {
            query = query.eq('ojt_role', filters.role);
        }

        // Apply search filter — use individual ilike filters combined with .or()
        if (filters?.search && filters.search.trim()) {
            const searchTerm = filters.search.trim();
            const wildcardTerm = `%${searchTerm}%`;

            // Build the OR conditions for text search
            const orConditions: string[] = [
                `full_name.ilike.${wildcardTerm}`,
                `email.ilike.${wildcardTerm}`,
                `ojt_role.ilike.${wildcardTerm}`,
            ];

            // Only include ojt_id match if the search term is a valid number
            const numericSearch = parseInt(searchTerm, 10);
            if (!isNaN(numericSearch)) {
                orConditions.push(`ojt_id.eq.${numericSearch}`);
            }

            query = query.or(orConditions.join(','));
        }

        // Apply sort
        const ascending = filters?.sortDirection !== 'desc';
        query = query.order('full_name', { ascending });

        const { data, error } = await query;

        if (error) throw new Error(`Error Fetching Interns: ${error.message}`);
        return data as Users[];
    },

    // Get stats for the Manage Interns page
    async getInternStats() {
        const { data, error } = await supabase
            .from('users')
            .select('ojt_role, status')
            .eq('role', 'intern');

        if (error) throw new Error(`Error Fetching Intern Stats: ${error.message}`);

        const totalInterns = data?.length || 0;
        const uniqueRoles = new Set(data?.map(u => u.ojt_role).filter(Boolean));
        const totalRoles = uniqueRoles.size;
        const archivedInterns = data?.filter(u => u.status === 'archived').length || 0;

        return { totalInterns, totalRoles, archivedInterns };
    },

    // Update an intern's profile
    async updateIntern(internId: string, updates: Partial<Users>) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', internId)
            .select()
            .single();

        if (error) throw new Error(`Error Updating Intern: ${error.message}`);
        return data as Users;
    },

    // Archive or restore an intern
    async toggleArchiveIntern(internId: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        const { data, error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', internId)
            .select()
            .single();

        if (error) throw new Error(`Error Archiving Intern: ${error.message}`);
        return data as Users;
    },

    // Get all unique OJT roles for filter dropdown
    async getOjtRoles() {
        const { data, error } = await supabase
            .from('users')
            .select('ojt_role')
            .eq('role', 'intern')
            .not('ojt_role', 'is', null);

        if (error) throw new Error(`Error Fetching OJT Roles: ${error.message}`);

        const uniqueRoles = [...new Set(data?.map(u => u.ojt_role).filter(Boolean))];
        return uniqueRoles as string[];
    },

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw new Error(`Error Fetching Profile: ${error.message}`);
        return data as Users;
    },

    // Get stats for the Admin Dashboard
    async getDashboardStats() {
        const { data: interns, error } = await supabase
            .from('users')
            .select('id, status, created_at, ojt_id, start_date')
            .eq('role', 'intern');

        if (error) throw new Error(`Error Fetching Dashboard Stats: ${error.message}`);

        const totalInterns = interns?.length || 0;
        const activeInterns = interns?.filter(u => u.status === 'active').length || 0;
        // Assumption: Pending if active but missing critical info like ojt_id or start_date
        const pendingApplications = interns?.filter(u => u.status === 'active' && (!u.ojt_id || !u.start_date)).length || 0;

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentRegisters = interns?.filter(u => new Date(u.created_at!) >= threeMonthsAgo).map(u => u.created_at!) || [];

        return {
            totalInterns,
            activeInterns,
            pendingApplications,
            recentRegisters
        };
    },

    // Get recent interns for activity feed
    async getRecentInterns(limit: number = 5) {
        const { data, error } = await supabase
            .from('users')
            .select('full_name, created_at, avatar_url')
            .eq('role', 'intern')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(`Error Fetching Recent Interns: ${error.message}`);
        return data;
    },

    // Fetch all admins with optional filters
    async fetchAdmins(filters?: {
        search?: string;
        status?: string;
        dateSort?: 'newest' | 'oldest';
    }) {
        let query = supabase
            .from('users')
            .select('*')
            .eq('role', 'admin');

        // Apply status filter
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }

        // Apply search filter
        if (filters?.search && filters.search.trim()) {
            const searchTerm = filters.search.trim();
            const wildcardTerm = `%${searchTerm}%`;
            query = query.or(`full_name.ilike.${wildcardTerm},email.ilike.${wildcardTerm}`);
        }

        // Apply date sort
        if (filters?.dateSort === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else {
            // Default to newest
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw new Error(`Error Fetching Admins: ${error.message}`);
        return data as Users[];
    },

    // Get stats for the Manage Admins page
    async getAdminStats() {
        const { data, error } = await supabase
            .from('users')
            .select('status')
            .eq('role', 'admin');

        if (error) throw new Error(`Error Fetching Admin Stats: ${error.message}`);

        const totalAdmins = data?.length || 0;
        const activeAdmins = data?.filter(u => u.status === 'active').length || 0;
        const archivedAdmins = data?.filter(u => u.status === 'archived').length || 0;

        return { totalAdmins, activeAdmins, archivedAdmins };
    },

    // Toggle archive status for an admin
    async toggleArchiveAdmin(adminId: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'archived' : 'active';
        const { data, error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', adminId)
            .select()
            .single();

        if (error) throw new Error(`Error Archiving Admin: ${error.message}`);
        return data as Users;
    },

    // Fetch interns eligible for admin upgrade (active interns)
    async fetchInternsForAdminUpgrade() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'intern')
            .eq('status', 'active')
            .order('full_name', { ascending: true });

        if (error) throw new Error(`Error Fetching Interns for Upgrade: ${error.message}`);
        return data as Users[];
    },

    // Upgrade an intern to admin
    async upgradeInternToAdmin(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(`Error Upgrading Intern to Admin: ${error.message}`);
        return data as Users;
    }

}