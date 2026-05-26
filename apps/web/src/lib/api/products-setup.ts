import api from '@/lib/api';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
}

export interface Color {
  id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
  _count?: { productColors: number };
}

export interface Attribute {
  id: string;
  name: string;
  isActive: boolean;
  values: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
}

export interface SizeGuide {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Warranty {
  id: string;
  title: string;
  description?: string;
  duration: string;
  type: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductLabel {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  isActive: boolean;
  _count?: { products: number };
}

export const brandsApi = {
  list: (includeInactive = false) =>
    api.get('/brands', { params: { includeInactive } }).then(r => r.data.data as Brand[]),
  get: (id: string) => api.get(`/brands/${id}`).then(r => r.data.data as Brand),
  create: (data: Partial<Brand>) => api.post('/brands', data).then(r => r.data.data as Brand),
  update: (id: string, data: Partial<Brand>) =>
    api.patch(`/brands/${id}`, data).then(r => r.data.data as Brand),
  remove: (id: string) => api.delete(`/brands/${id}`),
};

export const colorsApi = {
  list: (includeInactive = false) =>
    api.get('/colors', { params: { includeInactive } }).then(r => r.data.data as Color[]),
  create: (data: Partial<Color>) => api.post('/colors', data).then(r => r.data.data as Color),
  update: (id: string, data: Partial<Color>) =>
    api.patch(`/colors/${id}`, data).then(r => r.data.data as Color),
  remove: (id: string) => api.delete(`/colors/${id}`),
};

export const attributesApi = {
  list: (includeInactive = false) =>
    api.get('/attributes', { params: { includeInactive } }).then(r => r.data.data as Attribute[]),
  get: (id: string) => api.get(`/attributes/${id}`).then(r => r.data.data as Attribute),
  create: (data: { name: string; values?: string[] }) =>
    api.post('/attributes', data).then(r => r.data.data as Attribute),
  update: (id: string, data: { name?: string; isActive?: boolean; values?: string[] }) =>
    api.patch(`/attributes/${id}`, data).then(r => r.data.data as Attribute),
  remove: (id: string) => api.delete(`/attributes/${id}`),
  addValue: (id: string, value: string) =>
    api.post(`/attributes/${id}/values`, { value }).then(r => r.data.data),
  removeValue: (valueId: string) => api.delete(`/attributes/values/${valueId}`),
};

export const sizeGuidesApi = {
  list: (includeInactive = false) =>
    api.get('/size-guides', { params: { includeInactive } }).then(r => r.data.data as SizeGuide[]),
  get: (id: string) => api.get(`/size-guides/${id}`).then(r => r.data.data as SizeGuide),
  create: (data: Partial<SizeGuide>) =>
    api.post('/size-guides', data).then(r => r.data.data as SizeGuide),
  update: (id: string, data: Partial<SizeGuide>) =>
    api.patch(`/size-guides/${id}`, data).then(r => r.data.data as SizeGuide),
  remove: (id: string) => api.delete(`/size-guides/${id}`),
};

export const warrantiesApi = {
  list: (includeInactive = false) =>
    api.get('/warranties', { params: { includeInactive } }).then(r => r.data.data as Warranty[]),
  get: (id: string) => api.get(`/warranties/${id}`).then(r => r.data.data as Warranty),
  create: (data: Partial<Warranty>) =>
    api.post('/warranties', data).then(r => r.data.data as Warranty),
  update: (id: string, data: Partial<Warranty>) =>
    api.patch(`/warranties/${id}`, data).then(r => r.data.data as Warranty),
  remove: (id: string) => api.delete(`/warranties/${id}`),
};

export const productLabelsApi = {
  list: (includeInactive = false) =>
    api.get('/product-labels', { params: { includeInactive } }).then(r => r.data.data as ProductLabel[]),
  create: (data: Partial<ProductLabel>) =>
    api.post('/product-labels', data).then(r => r.data.data as ProductLabel),
  update: (id: string, data: Partial<ProductLabel>) =>
    api.patch(`/product-labels/${id}`, data).then(r => r.data.data as ProductLabel),
  remove: (id: string) => api.delete(`/product-labels/${id}`),
};
