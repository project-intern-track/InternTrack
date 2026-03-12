import { apiClient } from './apiClient';

export type CompetencyRating = {
  competency: string;
  rating: number;
  comment: string;
};

export type FeedbackRow = {
  taskId: number;
  taskName: string;
  taskDescription: string;
  completionDate: string;
  internId: number;
  internName: string;
  internRole: string;
  feedbackSubmitted: boolean;
  competencyRatings?: CompetencyRating[];
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
  async getSupervisorTasks(): Promise<FeedbackRow[]> {
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
};
