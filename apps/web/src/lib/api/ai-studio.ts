import api from '@/lib/api';

// --- Types ---
export type AiFeatureType = 'PRODUCT_CONTENT' | 'PRODUCT_SEO' | 'CATEGORY_SEO' | 'LANDING_PAGE' | 'BLOG_ARTICLE' | 'AD_COPY' | 'EMAIL_COPY' | 'FAQ' | 'IMAGE_ALT_TEXT' | 'META_DESCRIPTION' | 'SCHEMA_MARKUP' | 'AGENT_TASK' | 'CUSTOM_PROMPT';
export type AiContentStatus = 'DRAFT' | 'APPROVED' | 'APPLIED' | 'ARCHIVED';
export type AiAgentType = 'SEO_AGENT' | 'CONTENT_AGENT' | 'PRODUCT_AGENT' | 'LANDING_PAGE_AGENT' | 'CUSTOMER_SUPPORT_AGENT' | 'INVENTORY_AGENT' | 'MARKETING_AGENT' | 'CUSTOM_AGENT';
export type AiAgentTaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface AiSettings { id: string; provider: string; defaultModel: string | null; isEnabled: boolean; temperature: number; maxTokens: number; systemPrompt: string | null; safetyMode: boolean; monthlyTokenLimit: number | null; }
export interface AiProviderStatus { activeProvider: string; activeModel: string | null; isEnabled: boolean; providers: Record<string, { configured: boolean; name: string; active: boolean }>; }
export interface AiGenerationLog { id: string; provider: string; model: string | null; featureType: AiFeatureType; inputSummary: string | null; outputSummary: string | null; tokenInput: number | null; tokenOutput: number | null; estimatedCost: number | null; status: 'SUCCESS' | 'FAILED'; errorMessage: string | null; createdAt: string; }
export interface AiGeneratedContent { id: string; featureType: AiFeatureType; relatedEntityType: string | null; relatedEntityId: string | null; title: string; contentJson: Record<string, unknown>; contentText: string; status: AiContentStatus; createdAt: string; }
export interface AiAgentIntegration { id: string; name: string; provider: string; agentType: AiAgentType; description: string | null; endpointUrl: string | null; apiKeyEnvName: string | null; isEnabled: boolean; configJson: Record<string, unknown> | null; createdAt: string; }
export interface AiAgentTask { id: string; agentIntegrationId: string | null; taskType: string; status: AiAgentTaskStatus; inputJson: Record<string, unknown>; outputJson: Record<string, unknown> | null; errorMessage: string | null; startedAt: string | null; completedAt: string | null; createdAt: string; }

export const aiApi = {
  // Settings & Status
  getSettings: () => api.get('/admin/ai/settings').then(r => r.data.data as AiSettings),
  updateSettings: (data: Partial<AiSettings>) => api.patch('/admin/ai/settings', data).then(r => r.data.data),
  getProviderStatus: () => api.get('/admin/ai/providers/status').then(r => r.data.data as AiProviderStatus),
  testProvider: () => api.post('/admin/ai/providers/test').then(r => r.data.data as { success: boolean; latencyMs: number; error?: string }),

  // Generation
  generateProductContent: (data: Record<string, unknown>) => api.post('/admin/ai/generate/product-content', data).then(r => r.data.data),
  generateProductSeo: (data: Record<string, unknown>) => api.post('/admin/ai/generate/product-seo', data).then(r => r.data.data),
  generateCategorySeo: (data: Record<string, unknown>) => api.post('/admin/ai/generate/category-seo', data).then(r => r.data.data),
  generateLandingPage: (data: Record<string, unknown>) => api.post('/admin/ai/generate/landing-page', data).then(r => r.data.data),
  generateBlog: (data: Record<string, unknown>) => api.post('/admin/ai/generate/blog', data).then(r => r.data.data),
  generateAdCopy: (data: Record<string, unknown>) => api.post('/admin/ai/generate/ad-copy', data).then(r => r.data.data),
  generateEmail: (data: Record<string, unknown>) => api.post('/admin/ai/generate/email', data).then(r => r.data.data),
  generateFaq: (data: Record<string, unknown>) => api.post('/admin/ai/generate/faq', data).then(r => r.data.data),
  generateImageAlt: (data: Record<string, unknown>) => api.post('/admin/ai/generate/image-alt-text', data).then(r => r.data.data),
  generateCustom: (data: { prompt: string; outputFormat?: string }) => api.post('/admin/ai/generate/custom', data).then(r => r.data.data),

  // Logs
  getLogs: (params?: { page?: number; limit?: number; featureType?: string; status?: string }) => api.get('/admin/ai/logs', { params }).then(r => r.data.data as { data: AiGenerationLog[]; meta: { total: number; page: number; limit: number; totalPages: number } }),

  // Content library
  listContents: (params?: { page?: number; limit?: number; featureType?: string; status?: string }) => api.get('/admin/ai/generated-contents', { params }).then(r => r.data.data as { data: AiGeneratedContent[]; meta: { total: number; page: number; limit: number; totalPages: number } }),
  getContent: (id: string) => api.get(`/admin/ai/generated-contents/${id}`).then(r => r.data.data as AiGeneratedContent),
  approveContent: (id: string) => api.post(`/admin/ai/generated-contents/${id}/approve`).then(r => r.data.data),
  applyContent: (id: string) => api.post(`/admin/ai/generated-contents/${id}/apply`).then(r => r.data.data),
  archiveContent: (id: string) => api.post(`/admin/ai/generated-contents/${id}/archive`).then(r => r.data.data),

  // Agents
  listAgents: () => api.get('/admin/ai/agents').then(r => r.data.data as AiAgentIntegration[]),
  createAgent: (data: Partial<AiAgentIntegration>) => api.post('/admin/ai/agents', data).then(r => r.data.data),
  updateAgent: (id: string, data: Partial<AiAgentIntegration>) => api.patch(`/admin/ai/agents/${id}`, data).then(r => r.data.data),
  deleteAgent: (id: string) => api.delete(`/admin/ai/agents/${id}`).then(r => r.data),
  testAgent: (id: string) => api.post(`/admin/ai/agents/${id}/test`).then(r => r.data.data),
  runAgentTask: (id: string, data: Record<string, unknown>) => api.post(`/admin/ai/agents/${id}/run-task`, data).then(r => r.data.data),
  listAgentTasks: (agentId?: string) => api.get('/admin/ai/agent-tasks', { params: { agentId } }).then(r => r.data.data as AiAgentTask[]),
};
