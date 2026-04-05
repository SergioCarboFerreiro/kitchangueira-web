import { getToken, logout } from './auth';
import type { LoginResponse, UserInfo } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    logout();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Types
export interface LocalResponse {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  workerCount: number;
}

export interface WorkerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  active: boolean;
  locals: { id: string; name: string }[];
}

export interface ShiftResponse {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes: string | null;
}

export interface RotaResponse {
  id: string;
  localId: string;
  localName: string;
  weekStart: string;
  status: string;
  publishedAt: string | null;
  shifts: ShiftResponse[];
}

export interface ShiftRequest {
  workerId: string;
  date: string;
  startTime: string;
  endTime: string;
  position: string;
  notes?: string;
}

// Recipe types
export interface RecipeListItem {
  id: string;
  name: string;
  category: string;
  portions: number;
  prepTimeMinutes: number | null;
  imageUrl: string | null;
  ingredientCount: number;
  stepCount: number;
}

export interface RecipeResponse {
  id: string;
  name: string;
  category: string;
  portions: number;
  prepTimeMinutes: number | null;
  imageUrl: string | null;
  ingredients: IngredientResponse[];
  steps: StepResponse[];
  createdBy: string;
  createdAt: string;
}

export interface IngredientResponse {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface StepResponse {
  id: string;
  stepNumber: number;
  description: string;
}

export interface RecipeRequest {
  name: string;
  category: string;
  portions: number;
  prepTimeMinutes?: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: { stepNumber: number; description: string }[];
}

// Stock types
export interface StockDashboardItem {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  maxQuantity: number | null;
  status: 'ok' | 'low' | 'critical';
  lastCountAt: string | null;
  lastCountBy: string | null;
}

export interface ProductResponse {
  id: string;
  name: string;
  category: string;
  unit: string;
}

// Order types
export interface SupplierResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  orderCount: number;
}

export interface OrderListItem {
  id: string;
  supplierName: string;
  localName: string;
  status: string;
  lineCount: number;
  createdAt: string;
  sentAt: string | null;
}

export interface OrderResponse {
  id: string;
  supplierName: string;
  supplierEmail: string | null;
  localName: string;
  status: string;
  notes: string | null;
  lines: OrderLineResponse[];
  createdBy: string;
  createdAt: string;
  sentAt: string | null;
}

export interface OrderLineResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  notes: string | null;
}

// Waste types
export interface WasteResponse {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: string;
  reasonLabel: string;
  notes: string | null;
  registeredBy: string;
  registeredAt: string;
}

export interface WasteSummary {
  totalEntries: number;
  byReason: { reason: string; reasonLabel: string; totalQuantity: number; entryCount: number }[];
  byProduct: { productName: string; unit: string; totalQuantity: number; topReason: string }[];
}

// Temperature types
export interface TempZoneResponse {
  id: string;
  name: string;
  zoneType: string;
  zoneTypeLabel: string;
  minTemp: number;
  maxTemp: number;
  lastLog: TempLogResponse | null;
}

export interface TempLogResponse {
  id: string;
  zoneName: string;
  temperature: number;
  inRange: boolean;
  notes: string | null;
  registeredBy: string;
  registeredAt: string;
}

// API calls
export const api = {
  // Auth (no token needed)
  login: (username: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: {
    name: string; email: string; username: string; password: string;
    businessName: string; localName: string; localAddress?: string;
  }) =>
    apiFetch<{ token: string; user: UserInfo }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiFetch<UserInfo>('/api/auth/me'),

  // Data (token required)
  getLocals: () => apiFetch<LocalResponse[]>('/api/locals'),
  getWorkers: (localId?: string) =>
    apiFetch<WorkerResponse[]>(`/api/workers${localId ? `?localId=${localId}` : ''}`),
  createWorker: (data: { name: string; username: string; password: string; role: string; localIds: string[]; email?: string }) =>
    apiFetch<unknown>('/api/workers', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorker: (id: string) =>
    apiFetch<{ status: string }>(`/api/workers/${id}`, { method: 'DELETE' }),
  resetWorkerPassword: (id: string, newPassword: string) =>
    apiFetch<{ status: string }>(`/api/workers/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }),

  getRota: (localId: string, weekStart: string) =>
    apiFetch<RotaResponse>(`/api/rotas/${localId}/week/${weekStart}`),

  saveRota: (localId: string, weekStart: string, shifts: ShiftRequest[]) =>
    apiFetch<RotaResponse>(`/api/rotas/${localId}/week/${weekStart}`, {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    }),

  publishRota: (rotaId: string) =>
    apiFetch<{ status: string }>(`/api/rotas/${rotaId}/publish`, { method: 'POST' }),

  copyPreviousWeek: (localId: string, weekStart: string) =>
    apiFetch<RotaResponse>(`/api/rotas/${localId}/week/${weekStart}/copy-previous`, {
      method: 'POST',
    }),

  // Recipes
  getRecipes: (category?: string) =>
    apiFetch<RecipeListItem[]>(`/api/recipes${category ? `?category=${category}` : ''}`),
  getRecipe: (id: string) => apiFetch<RecipeResponse>(`/api/recipes/${id}`),
  getCategories: () => apiFetch<string[]>('/api/recipes/categories'),
  createRecipe: (data: RecipeRequest) =>
    apiFetch<RecipeResponse>('/api/recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateRecipe: (id: string, data: RecipeRequest) =>
    apiFetch<RecipeResponse>(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecipe: (id: string) =>
    apiFetch<{ status: string }>(`/api/recipes/${id}`, { method: 'DELETE' }),

  // Stock
  getStockDashboard: (localId: string) =>
    apiFetch<StockDashboardItem[]>(`/api/stock/${localId}/dashboard`),
  getStockAlerts: (localId: string) =>
    apiFetch<StockDashboardItem[]>(`/api/stock/${localId}/alerts`),
  submitStockCount: (localId: string, items: { productId: string; quantity: number }[], notes?: string) =>
    apiFetch<unknown>(`/api/stock/${localId}/count`, {
      method: 'POST',
      body: JSON.stringify({ items, notes }),
    }),
  getProducts: (category?: string) =>
    apiFetch<ProductResponse[]>(`/api/products${category ? `?category=${category}` : ''}`),
  createProduct: (data: { name: string; category: string; unit: string }) =>
    apiFetch<ProductResponse>('/api/products', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => apiFetch<SupplierResponse[]>('/api/suppliers'),
  createSupplier: (data: { name: string; email?: string; phone?: string; notes?: string }) =>
    apiFetch<SupplierResponse>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: { name: string; email?: string; phone?: string; notes?: string }) =>
    apiFetch<SupplierResponse>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) =>
    apiFetch<{ status: string }>(`/api/suppliers/${id}`, { method: 'DELETE' }),

  // Waste
  registerWaste: (localId: string, data: { productId: string; quantity: number; reason: string; notes?: string }) =>
    apiFetch<WasteResponse>(`/api/waste/${localId}`, { method: 'POST', body: JSON.stringify(data) }),
  getWaste: (localId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return apiFetch<WasteResponse[]>(`/api/waste/${localId}${qs ? `?${qs}` : ''}`);
  },
  getWasteSummary: (localId: string) => apiFetch<WasteSummary>(`/api/waste/${localId}/summary`),

  // Temperature
  getTempZones: (localId: string) => apiFetch<TempZoneResponse[]>(`/api/temperatures/${localId}/zones`),
  createTempZone: (localId: string, data: { name: string; zoneType: string; minTemp: number; maxTemp: number }) =>
    apiFetch<TempZoneResponse>(`/api/temperatures/${localId}/zones`, { method: 'POST', body: JSON.stringify(data) }),
  deleteTempZone: (zoneId: string) =>
    apiFetch<{ status: string }>(`/api/temperatures/zones/${zoneId}`, { method: 'DELETE' }),
  logTemperature: (zoneId: string, data: { temperature: number; notes?: string }) =>
    apiFetch<TempLogResponse>(`/api/temperatures/zones/${zoneId}/log`, { method: 'POST', body: JSON.stringify(data) }),
  batchLogTemperature: (logs: { zoneId: string; temperature: number; notes?: string }[]) =>
    apiFetch<TempLogResponse[]>('/api/temperatures/batch-log', { method: 'POST', body: JSON.stringify({ logs }) }),
  getTempHistory: (zoneId: string) => apiFetch<TempLogResponse[]>(`/api/temperatures/zones/${zoneId}/history`),

  // Orders
  getOrders: (localId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (localId) params.set('localId', localId);
    if (status) params.set('status', status);
    const qs = params.toString();
    return apiFetch<OrderListItem[]>(`/api/orders${qs ? `?${qs}` : ''}`);
  },
  getOrder: (id: string) => apiFetch<OrderResponse>(`/api/orders/${id}`),
  createOrder: (localId: string, data: { supplierId: string; lines: { productId: string; quantity: number; unit: string; notes?: string }[]; notes?: string }) =>
    apiFetch<OrderResponse>(`/api/orders/${localId}`, { method: 'POST', body: JSON.stringify(data) }),
  sendOrder: (id: string) => apiFetch<{ status: string }>(`/api/orders/${id}/send`, { method: 'POST' }),
  deliverOrder: (id: string) => apiFetch<{ status: string }>(`/api/orders/${id}/deliver`, { method: 'POST' }),
};
