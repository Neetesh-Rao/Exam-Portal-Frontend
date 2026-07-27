/**
 * Shared fetch utilities for making authenticated API calls.
 * Reads the JWT token from localStorage and sends it as Authorization Bearer.
 * Uses NEXT_PUBLIC_API_URL for cross-domain requests on Vercel production.
 */

export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base ? `${base}/api${path}` : `/api${path}`;
}

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(getApiUrl(path), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
    credentials: "include",
  });
}
