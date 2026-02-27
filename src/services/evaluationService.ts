// ========
// IMPORTS
// ========
// TODO: Migrate to apiClient — Supabase has been removed.
// import { apiClient } from "./apiClient";
import { evaluationSchema } from "./validation";
import type { Evaluation } from "../types/database.types";


// Evaluation Services Functions
// TODO: Each method below needs a corresponding Laravel backend endpoint.
// Once the backend routes/controllers are created, replace the placeholder
// implementations with apiClient calls (e.g. apiClient.get('/evaluations')).
export const evaluationService = {

    async getEvaluations(): Promise<Evaluation[]> {
        // TODO: Replace with apiClient.get('/evaluations')
        console.warn('evaluationService.getEvaluations() not yet migrated to Laravel backend.');
        return [];
    },

    async createEvaluation(newEvaluationData: Omit<Evaluation, 'id' | 'created_at'>): Promise<Evaluation> {
        const validation = evaluationSchema.safeParse(newEvaluationData);
        if (!validation.success) {
            throw new Error(`Invalid Evaluation Data: ${validation.error.message}`);
        }
        // TODO: Replace with apiClient.post('/evaluations', newEvaluationData)
        throw new Error('evaluationService.createEvaluation() not yet migrated to Laravel backend.');
    }

}