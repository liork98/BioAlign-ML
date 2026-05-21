"use client"

import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Database, FlaskConical } from "lucide-react"

export function MetricBar() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">BioAlign-ML</span>
        <span className="text-xs text-muted-foreground">Dashboard</span>
      </div>

      <div className="flex items-center gap-6">
        {/* System Health */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">System Health</span>
          </div>
          <Badge className="bg-success/15 text-success border-success/30 font-medium">
            Operational
          </Badge>
        </div>

        {/* Processing Queue */}
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Processing Queue</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            0 Jobs Active
          </Badge>
        </div>

        {/* Total Samples */}
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Evaluated Samples</span>
          </div>
          <span className="text-sm font-semibold text-foreground font-mono">24,850</span>
        </div>

        {/* Benchmark Score */}
        <div className="flex items-center gap-3 border-l border-border pl-6">
          <span className="text-xs text-muted-foreground">Last Benchmark Stability</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-primary font-mono">0.84</span>
            <span className="text-xs text-muted-foreground">ARI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
