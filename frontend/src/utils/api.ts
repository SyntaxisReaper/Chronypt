const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function refreshSession(): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  return res.ok;
}

export async function apiFetch(path: string, init: RequestInit = {}, retryOn401 = true): Promise<Response> {
  const headers = new Headers(init.headers || undefined);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch(path, init, false);
    }
  }

  return response;
}
