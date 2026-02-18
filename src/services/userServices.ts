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
        return data;
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
    }

}