import api from '@/lib/api';

export type SeoEntityType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'PAGE' | 'BLOG' | 'LANDING_PAGE' | 'HOME' | 'CUSTOM';
export type SeoAuditStatus = 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
export type SeoRedirectCode = 'R301' | 'R302' | 'R307' | 'R308';

export interface SeoMetadata { id: string; entityType: SeoEntityType; entityId: string | null; seoTitle: string | null; metaDescription: string | null; metaKeywords: string | null; slug: string | null; canonicalUrl: string | null; robotsIndex: boolean; robotsFollow: boolean; ogTitle: string | null; ogDescription: string | null; ogImage: string | null; twitterTitle: string | null; twitterDescription: string | null; twitterImage: string | null; focusKeyword: string | null; secondaryKeywordsJson: string[] | null; schemaType: string | null; schemaJson: Record<string, unknown> | null; seoScore: number | null; lastAuditedAt: string | null; createdAt: string; updatedAt: string; }
export interface SeoAudit { id: string; entityType: SeoEntityType; entityId: string | null; score: number; status: SeoAuditStatus; issuesJson: { issue: string; severity: string }[]; suggestionsJson: { suggestion: string; priority: string }[]; createdAt: string; }
export interface SeoRedirect { id: string; sourcePath: string; targetPath: string; statusCode: SeoRedirectCode; isActive: boolean; hitCount: number; createdAt: string; updatedAt: string; }
export interface SeoSettings { id: string; siteName: string; defaultTitle: string | null; titleTemplate: string; defaultMetaDescription: string | null; defaultOgImage: string | null; robotsTxt: string | null; enableAutoSitemap: boolean; enableSchemaMarkup: boolean; enableOpenGraph: boolean; enableTwitterCards: boolean; enableCanonicalUrls: boolean; }
export interface SeoDashboard { totalProducts: number; productsWithMetaTitle: number; productsWithoutMetaTitle: number; productsWithMetaDesc: number; productsWithoutMetaDesc: number; metaTitlePct: number; metaDescPct: number; keywordsPct: number; totalCategories: number; activeRedirects: number; sitemapEntries: number; recentAudits: SeoAudit[]; }

export const seoApi = {
  getDashboard: () => api.get('/seo/dashboard').then(r => r.data.data as SeoDashboard).catch(() => api.get('/seo/stats').then(r => r.data.data as SeoDashboard)),
  getStats: () => api.get('/seo/stats').then(r => r.data.data as SeoDashboard),

  // Products SEO
  getProductsSeo: (params?: { page?: number; limit?: number; missingMeta?: boolean }) => api.get('/seo/products', { params }).then(r => r.data.data ?? r.data),
  getProductSeo: (id: string) => api.get(`/seo/products/${id}/full`).then(r => r.data.data).catch(() => api.get(`/seo/products/${id}`).then(r => r.data.data)),
  updateProductSeo: (id: string, data: Partial<SeoMetadata>) => api.patch(`/seo/products/${id}`, data).then(r => r.data.data),
  auditProduct: (id: string) => api.post(`/seo/products/${id}/audit`).then(r => r.data.data as SeoAudit),
  generateAiProductSeo: (id: string) => api.post(`/seo/products/${id}/generate-ai`).then(r => r.data.data),

  // Categories SEO
  getCategoriesSeo: (params?: { page?: number; limit?: number }) => api.get('/seo/categories', { params }).then(r => r.data.data),
  getCategorySeo: (id: string) => api.get(`/seo/categories/${id}`).then(r => r.data.data),
  updateCategorySeo: (id: string, data: Partial<SeoMetadata>) => api.patch(`/seo/categories/${id}`, data).then(r => r.data.data),
  auditCategory: (id: string) => api.post(`/seo/categories/${id}/audit`).then(r => r.data.data as SeoAudit),

  // Metadata CRUD
  listMetadata: (params?: { entityType?: SeoEntityType; page?: number; limit?: number }) => api.get('/seo/metadata', { params }).then(r => r.data.data),
  createMetadata: (data: Partial<SeoMetadata>) => api.post('/seo/metadata', data).then(r => r.data.data),
  updateMetadata: (id: string, data: Partial<SeoMetadata>) => api.patch(`/seo/metadata/${id}`, data).then(r => r.data.data),
  deleteMetadata: (id: string) => api.delete(`/seo/metadata/${id}`).then(r => r.data),

  // Audits
  listAudits: (params?: { page?: number; limit?: number }) => api.get('/seo/audits', { params }).then(r => r.data.data as { data: SeoAudit[]; total: number }),

  // Redirects
  listRedirects: (params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) => api.get('/seo/redirects', { params }).then(r => r.data.data as { data: SeoRedirect[]; total: number }),
  createRedirect: (data: { sourcePath: string; targetPath: string; statusCode?: SeoRedirectCode; isActive?: boolean }) => api.post('/seo/redirects', data).then(r => r.data.data as SeoRedirect),
  updateRedirect: (id: string, data: Partial<SeoRedirect>) => api.patch(`/seo/redirects/${id}`, data).then(r => r.data.data),
  deleteRedirect: (id: string) => api.delete(`/seo/redirects/${id}`).then(r => r.data),

  // Sitemap
  getSitemap: () => api.get('/seo/sitemap').then(r => r.data.data),
  regenerateSitemap: () => api.post('/seo/sitemap/regenerate').then(r => r.data.data),
  updateSitemapEntry: (id: string, data: { priority?: number; changeFrequency?: string; includeInSitemap?: boolean }) => api.patch(`/seo/sitemap/entries/${id}`, data).then(r => r.data.data),

  // Robots
  getRobots: () => api.get('/seo/robots').then(r => r.data.data as { robotsTxt: string }),
  updateRobots: (robotsTxt: string) => api.patch('/seo/robots', { robotsTxt }).then(r => r.data.data),

  // Image Alts
  listImageAlts: (params?: { page?: number; limit?: number; entityType?: SeoEntityType }) => api.get('/seo/image-alts', { params }).then(r => r.data.data),
  updateImageAlt: (id: string, data: { altText?: string; titleText?: string }) => api.patch(`/seo/image-alts/${id}`, data).then(r => r.data.data),

  // Settings
  getSettings: () => api.get('/seo/settings').then(r => r.data.data as SeoSettings),
  updateSettings: (data: Partial<SeoSettings>) => api.patch('/seo/settings', data).then(r => r.data.data),
};
