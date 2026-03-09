// ========
// IMPORTS
// ========
// TODO: Migrate to apiClient — Supabase has been removed.
// import { apiClient } from "./apiClient";
import { apiClient } from "./apiClient";
import { evaluationSchema } from "./validation";
import type { Evaluation } from "../types/database.types";


// Evaluation Services Functions
// TODO: Each method below needs a corresponding Laravel backend endpoint.
// Once the backend routes/controllers are created, replace the placeholder
// implementations with apiClient calls (e.g. apiClient.get('/evaluations')).
export const evaluationService = {

    async getEvaluations(): Promise<Evaluation[]> {

        try {

            const response = await apiClient.get('/evaluations');
            console.log('API Response:', response.data);
            return response.data.data || response.data; 
        } catch (err: any) {

            console.error('Failed to fetch current Evaluations: ', err);
            throw new Error('Unable to retrieve Evaluations at this time.');

        }

    },


    async getEvaluationById(id: string): Promise<Evaluation> {


        try {
            const response = await apiClient.get(`/evaluations/${id}`);
            return response.data.data;
        } catch (err: any) {
            console.error('Failed to fetch Evaluation by ID: ', err);
            throw new Error('Unable to retrieve Evaluation details at this time.');
        }

    },


    async createEvaluation(newEvaluationData: Omit<Evaluation, 'id' | 'created_at'>): Promise<Evaluation> {

        try {
            const validation = evaluationSchema.safeParse(newEvaluationData);
            if(!validation.success) {
                throw new Error(`Invalid Evaluation Data:  ${validation.error.message}`);
        }


        // If Success Send to Backend
        const response = await apiClient.post('/evaluations', newEvaluationData);
        return response.data.data;

        } catch (err: any) {
            console.error('Failed to create Evaluation: ', err);
            throw new Error('Unable to create Evaluation at this time.');
        }

    },

    // Update Current Evaluation Data
    async updateEvaluation(id: string, updateData: Partial<Omit<Evaluation, 'id' | 'created_at'>>): Promise<Evaluation> {

        try {
            const response = await apiClient.put(`/evaluations/${id}`, updateData);
            return response.data.data;
        } catch (error: any) {
            console.error('Failed to update evaluation:', error);
            throw new Error(error.message || 'Failed to update evaluation');
        }
    },

    // Delete Evaluation by ID
    async deleteEvaluation(id: string): Promise<void> {

        try {
            await apiClient.delete(`/evaluations/${id}`);
        }   catch (err: any) {
            console.error('Failed to delete Evaluation: ', err);
            throw new Error('Unable to delete Evaluation at this time.');
        }

    }


}