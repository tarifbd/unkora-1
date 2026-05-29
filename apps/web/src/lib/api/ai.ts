import api from '@/lib/api';

export interface ChatResponse {
  reply: string;
}

export interface ReviewSummaryResponse {
  summary: string;
}

export const aiApi = {
  chat: (query: string, context?: string): Promise<ChatResponse> =>
    api.post('/ai/chat', { query, context }).then((r) => r.data.data as ChatResponse),

  summarizeReviews: (
    reviews: { rating: number; comment: string }[],
  ): Promise<ReviewSummaryResponse> =>
    api
      .post('/ai/reviews/summary', { reviews })
      .then((r) => r.data.data as ReviewSummaryResponse),
};
