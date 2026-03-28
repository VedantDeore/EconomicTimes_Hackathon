/**
 * When true (default), all finance features run in the browser with no backend.
 * Set NEXT_PUBLIC_USE_LOCAL_ENGINE=false to use NEXT_PUBLIC_API_URL instead.
 */
export function isLocalEngineMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCAL_ENGINE !== "false";
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000/api/v1";
}
