const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://achei-api-0bxq.onrender.com').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type AccessToken = string | (() => Promise<string | null>);

export async function apiRequest<T>(path: string, token: AccessToken, workspaceId?: string, init: RequestInit = {}): Promise<T> {
  const accessToken = typeof token === 'function' ? await token() : token;
  if (!accessToken) throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');
  if (workspaceId) headers.set('X-Workspace-ID', workspaceId);

  const response = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.error || 'Não foi possível concluir a operação.', response.status);
  }
  return payload as T;
}
