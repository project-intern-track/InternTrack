// ========
// IMPORTS
// ========
import { supabase } from "./supabaseClient";
import { evaluationSchema } from "./validation";
import type { Evaluation } from "../types/database.types"; // Evaluation Interface From Database Types



// Evaluation Services Functions
export const evaluationService = {


    async getEvaluations () {

        const {data, error} = await supabase
            .from(`evaluations`)
            .select('*');

        if (error) throw new Error(`Error Fetching Evaluations: ${error.message}`);
        return data;
    },

    async createEvaluation (newEvaluationData: Omit<Evaluation, 'id' | 'created_at'>) {

        const validation = evaluationSchema.safeParse(newEvaluationData);

        if (!validation.success) {
            throw new Error(`Invalid Evaluation Data: ${validation.error.message}`);
        }

        const {error, data} = await supabase
            .from('evaluations')
            .insert(newEvaluationData)
            .select()
            .single();


        if (error) throw new Error(`Error Creating Evaluation: ${error.message}`);
        return data as Evaluation;

    }

}