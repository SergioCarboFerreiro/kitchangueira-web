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
};
