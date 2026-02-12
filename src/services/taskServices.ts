// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { taskSchema } from "./validation";
import type { Tasks } from "../types/database.types"; // Tasks Interface From Database Types


// Task Services Functions
export const taskService = {

    // Gets All Task and Returns an Array
    async getTasks () {

        const { data, error } = await supabase
            .from('tasks')
            .select('*');

        // Catch and Log Errors
        if (error) throw new Error(`Error Fetching Tasks: ${error.message}`);
        return data;

    },

    // Creates a New Task and Returns the Created Task Object yet ignore auto generated fields (id and create_at)
    // Create Task (KAN 26 Functions)
    async createTask (newTaskData: Omit<Tasks, 'id' | 'created_at'>) { 

        const validation = taskSchema.safeParse(newTaskData);

        if (!validation.success) {
            throw new Error(`Invalid Task Data: ${validation.error.message}`);
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert(newTaskData)
            .select()
            .single();

        // Catch and Log Errors
        if (error) throw new Error(`Error Creating Task: ${error.message}`);
        return data as Tasks;
   

    }


}