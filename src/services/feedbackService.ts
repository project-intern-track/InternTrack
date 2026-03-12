import { apiClient } from './apiClient';

export type CompetencyRating = {
  competency: string;
  rating: number;
  comment: string;
};

export type FeedbackTaskIntern = {
  id: number;
  name: string;
  role: string;
  feedback_submitted: boolean;
  competency_ratings?: CompetencyRating[];
};

export type FeedbackTask = {
  id: number;
  taskName: string;
  taskDescription: string;
  completionDate: string;
  interns: FeedbackTaskIntern[];
  status: 'Pending' | 'Submitted';
};

export type SkillScore = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
};

export type FeedbackEntry = {
  id: string | number;
  competency: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName?: string;
};

export type MyFeedbackPayload = {
  skills: SkillScore[];
  recentFeedback: FeedbackEntry[];
};

export const feedbackService = {
  async getSupervisorTasks(): Promise<FeedbackTask[]> {
    const res = await apiClient.get('/feedback/tasks');
    return res.data.data;
  },

  async submitFeedback(taskId: number, internId: number, competencyRatings: CompetencyRating[]): Promise<void> {
    await apiClient.post(`/feedback/tasks/${taskId}/interns/${internId}`, {
      competency_ratings: competencyRatings,
    });
  },

  async getMyFeedback(): Promise<MyFeedbackPayload> {
    const res = await apiClient.get('/feedback/my-feedback');
    return res.data.data;
  },


  async getInternFinalScore(internId: number): Promise<{
      avgTaskCompletion: number;
      avgCompetency: string;
      finalScore: number;
  }> {
      try {
          const response = await apiClient.get(`/feedback/interns/${internId}/final-score`);
          return response.data.data;
      } catch (error) {
          console.error('Error getting intern final score:', error);
          return {
              avgTaskCompletion: 0,
              avgCompetency: '0/5',
              finalScore: 0
          };
      }
  },

};
