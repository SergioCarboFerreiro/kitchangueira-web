const API_BASE = import.meta.env.VITE_API_URL || '';

// Dev IDs from seed data
export const DEV_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEV_LOCAL_CENTRO = '00000000-0000-0000-0000-000000000010';
export const DEV_WORKER_MANAGER = '00000000-0000-0000-0000-000000000101';

interface ApiConfig {
  tenantId: string;
  workerId: string;
  workerRole: string;
}

let config: ApiConfig = {
  tenantId: DEV_TENANT_ID,
  workerId: DEV_WORKER_MANAGER,
  workerRole: 'manager',
};

export function setApiConfig(c: Partial<ApiConfig>) {
  config = { ...config, ...c };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': config.tenantId,
      'X-Worker-Id': config.workerId,
      'X-Worker-Role': config.workerRole,
      ...options.headers,
    },
  });
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
