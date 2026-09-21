export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export function apiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export type PipelineJob = {
  id: number
  sample_id: string
  status: "pass" | "fail" | "pending" | string
  gate_message: string | null
  cuda_usage_pct: number
  elapsed_ms: number
  n_spots: number
  n_genes: number
  input_hash: string | null
  dataset_name: string | null
  created_at: string
  updated_at: string
}

export type ExperimentRun = {
  id: number
  job_id: number
  name: string
  algorithm: string
  hyperparameters: Record<string, unknown>
  input_hash: string
  n_samples: number
  n_clusters: number
  silhouette: number
  ari: number
  stability: number
  embedding_method: string
  is_baseline: boolean
  created_at: string
}

export type EvaluationSummary = {
  silhouette: number | null
  silhouette_delta: number | null
  ari: number | null
  ari_delta: number | null
  stability: number | null
  n_runs: number
  n_samples: number
  runs: ExperimentRun[]
}

export type Cluster = {
  id: string
  label: number
  name: string
  color: string
  samples: number
  dominant_genes: string[]
  mean_silhouette: number
  compactness: number
  x: number
  y: number
}

export type UmapPoint = {
  barcode: string
  x: number
  y: number
  cluster: number
}

export type ExplorerPayload = {
  run_id: number | null
  algorithm: string | null
  embedding_method: string | null
  n_neighbors: number
  n_samples: number
  clusters: Cluster[]
  points: UmapPoint[]
}

export type DashboardMetrics = {
  system_health: "operational" | "degraded" | "down"
  database: string
  jobs_active: number
  total_samples: number
  last_ari: number | null
  last_stability: number | null
  dataset_name: string | null
}

export const getDashboardMetrics = () => fetchJSON<DashboardMetrics>("/metrics/summary")
export const getJobs = () => fetchJSON<PipelineJob[]>("/pipeline/jobs")
export const getEvaluation = () => fetchJSON<EvaluationSummary>("/evaluation")
export const getExplorer = () => fetchJSON<ExplorerPayload>("/explorer")
export const runPublicDataset = () =>
  fetchJSON<PipelineJob>("/pipeline/run-public", { method: "POST" })

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`
}
