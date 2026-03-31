const TOKEN_KEY = 'kitchangueira_token';
const USER_KEY = 'kitchangueira_user';

export interface UserInfo {
  id: string;
  name: string;
  username: string;
  email: string | null;
  tenantId: string;
  tenantName: string;
  role: string;
  locals: { localId: string; localName: string; role: string }[];
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
  mustChangePassword: boolean;
}

export function saveAuth(token: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
