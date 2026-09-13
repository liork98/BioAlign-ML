export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export function apiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}
