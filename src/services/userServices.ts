// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { usersSchema } from "./validation";
import type { Users } from "../types/database.types"; // User Interface From Database Types


// User Services Functions
export const userService = {


    async getUsers () {

        const {data, error} = await supabase
            .from('users')
            .select('*');

        if (error)  throw new Error(`Error Fetching Users: ${error.message}`);
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


    // Fetch Users (KAN 26 Functions)
    async fetchInterns () {
        const {data, error} = await supabase
            .from('users')
            .select('*')
            .eq('role', 'student'); // Filter User Roles

        if (error) throw new Error(`Error Fetching Interns: ${error.message}`);
        return data as Users[];
    }

}