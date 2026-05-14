import api from '@/lib/api';

export interface ProductImage { id: string; url: string; alt?: string; isPrimary: boolean; }
export interface BookDetail { author: string; publisher?: string; isbn?: string; language: string; pageCount?: number; edition?: string; genres: string[]; binding?: string; translator?: string; series?: string; }
export interface Category { id: string; name: string; slug: string; description?: string; _count?: { products: number } }
export interface Product {
  id: string; name: string; slug: string; description?: string; shortDesc?: string;
  basePrice: string; salePrice?: string; stockQuantity: number; sku: string;
  isActive: boolean; isFeatured: boolean; tags: string[];
  images: ProductImage[]; category: Category; bookDetail?: BookDetail;
  _count?: { reviews: number };
}
export interface PaginatedProducts {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean; };
}
export interface ProductQuery {
  page?: number; limit?: number; categorySlug?: string; search?: string;
  minPrice?: number; maxPrice?: number; isFeatured?: boolean; inStock?: boolean;
  sortBy?: string; sortOrder?: 'asc' | 'desc'; tags?: string;
}

export const productsApi = {
  getAll: (query: ProductQuery = {}) =>
    api.get('/products', { params: query }).then(r => r.data.data as PaginatedProducts),

  getBySlug: (slug: string) =>
    api.get(`/products/${slug}`).then(r => r.data.data as Product),

  getFeatured: (limit = 8) =>
    api.get('/products/featured', { params: { limit } }).then(r => r.data.data as Product[]),

  create: (data: Record<string, unknown>) =>
    api.post('/products', data).then(r => r.data.data as Product),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data).then(r => r.data.data as Product),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

export const booksApi = {
  getAll: (query: Record<string, unknown> = {}) =>
    api.get('/books', { params: query }).then(r => r.data.data as PaginatedProducts),

  getFilterOptions: () =>
    api.get('/books/filter-options').then(r => r.data.data as { authors: string[]; publishers: string[]; languages: string[]; genres: string[]; bindings: string[] }),
};

export const categoriesApi = {
  getAll: () =>
    api.get('/categories').then(r => r.data.data as Category[]),

  getRoots: () =>
    api.get('/categories').then(r => r.data.data as (Category & { children: Category[] })[]),

  getBySlug: (slug: string) =>
    api.get(`/categories/${slug}`).then(r => r.data.data as Category),

  create: (data: Record<string, unknown>) =>
    api.post('/categories', data).then(r => r.data.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};

export const searchApi = {
  search: (q: string, params: Record<string, unknown> = {}) =>
    api.get('/search', { params: { q, ...params } }).then(r => r.data.data as { hits: Product[]; total: number; facets?: Record<string, unknown> }),
};
