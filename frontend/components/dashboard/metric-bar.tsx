"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Database, FlaskConical } from "lucide-react"
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/api"

export function MetricBar() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getDashboardMetrics()
        if (!cancelled) setMetrics(data)
      } catch {
        if (!cancelled) {
          setMetrics({
            system_health: "down",
            database: "disconnected",
            jobs_active: 0,
            total_samples: 0,
            last_ari: null,
            last_stability: null,
            dataset_name: null,
          })
        }
      }
    }
    load()
    const id = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const health = metrics?.system_health ?? "degraded"
  const healthLabel = health === "operational" ? "Operational" : health === "degraded" ? "Degraded" : "Down"

  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">BioAlign-ML</span>
        <span className="text-xs text-muted-foreground">
          {metrics?.dataset_name ?? "Awaiting Visium ingest"}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">System Health</span>
          </div>
          <Badge
            className={
              health === "operational"
                ? "bg-success/15 text-success border-success/30 font-medium"
                : "bg-warning/15 text-warning border-warning/30 font-medium"
            }
          >
            {healthLabel}
          </Badge>
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Processing Queue</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {metrics?.jobs_active ?? 0} Jobs Active
          </Badge>
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Evaluated Samples</span>
          </div>
          <span className="text-sm font-semibold text-foreground font-mono">
            {(metrics?.total_samples ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-6">
          <span className="text-xs text-muted-foreground">Last Benchmark ARI</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-primary font-mono">
              {metrics?.last_ari == null ? "—" : metrics.last_ari.toFixed(3)}
            </span>
            <span className="text-xs text-muted-foreground">ARI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
