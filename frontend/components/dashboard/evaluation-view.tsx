"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, BarChart3, Target, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { apiUrl, getEvaluation, type EvaluationSummary } from "@/lib/api"

function deltaLabel(value: number | null): { text: string; up: boolean } | null {
  if (value == null) return null
  const up = value >= 0
  return { text: `${up ? "+" : ""}${value.toFixed(3)} vs baseline`, up }
}

export function EvaluationView() {
  const [data, setData] = useState<EvaluationSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const summary = await getEvaluation()
        if (!cancelled) setData(summary)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load evaluation")
      }
    }
    void load()
    const id = setInterval(load, 4000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const silDelta = deltaLabel(data?.silhouette_delta ?? null)
  const ariDelta = deltaLabel(data?.ari_delta ?? null)
  const baselineId = data?.runs.find((r) => r.is_baseline)?.id

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Silhouette Width</p>
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">
                  {data?.silhouette == null ? "—" : data.silhouette.toFixed(3)}
                </p>
                {silDelta && (
                  <div className={`mt-2 flex items-center gap-1 text-xs ${silDelta.up ? "text-success" : "text-warning"}`}>
                    {silDelta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{silDelta.text}</span>
                  </div>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cluster Stability Index</p>
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">
                  {data?.stability == null ? "—" : `${(data.stability * 100).toFixed(1)}%`}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Bootstrap ARI vs full labeling</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Activity className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Adjusted Rand Index</p>
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">
                  {data?.ari == null ? "—" : data.ari.toFixed(3)}
                </p>
                {ariDelta && (
                  <div className={`mt-2 flex items-center gap-1 text-xs ${ariDelta.up ? "text-success" : "text-warning"}`}>
                    {ariDelta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{ariDelta.text}</span>
                  </div>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Model Runs</p>
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">{data?.n_runs ?? 0}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data?.n_samples ? `${data.n_samples.toLocaleString()} Visium spots` : "No completed run"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Model Run Comparison</CardTitle>
              <CardDescription>Metrics computed on the same 10x Visium multimodal embedding</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {data?.runs.length ?? 0} Runs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!data?.runs.length ? (
            <p className="text-sm text-muted-foreground">Run the Visium pipeline to write benchmark rows to the database.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-muted-foreground">Run ID</TableHead>
                  <TableHead className="text-muted-foreground">Model Configuration</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground text-center">Silhouette</TableHead>
                  <TableHead className="text-muted-foreground text-center">ARI</TableHead>
                  <TableHead className="text-muted-foreground text-center">Stability</TableHead>
                  <TableHead className="text-muted-foreground text-center">Clusters</TableHead>
                  <TableHead className="text-muted-foreground text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.runs.map((run) => {
                  const improved = !run.is_baseline && baselineId != null && run.silhouette >= (data.runs.find((r) => r.id === baselineId)?.silhouette ?? 0)
                  return (
                    <TableRow key={run.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">run-{run.id}</TableCell>
                      <TableCell className="font-medium text-sm">{run.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(run.created_at).toISOString().slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{run.silhouette.toFixed(3)}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{run.ari.toFixed(3)}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{run.stability.toFixed(3)}</TableCell>
                      <TableCell className="text-center font-mono text-sm">{run.n_clusters}</TableCell>
                      <TableCell className="text-right">
                        {run.is_baseline && <Badge variant="secondary" className="text-xs">Baseline</Badge>}
                        {!run.is_baseline && improved && (
                          <Badge className="bg-success/15 text-success border-success/30 text-xs gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Improved
                          </Badge>
                        )}
                        {!run.is_baseline && !improved && (
                          <Badge className="bg-warning/15 text-warning border-warning/30 text-xs gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            vs baseline
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Benchmark Visualization</CardTitle>
          <CardDescription>Matplotlib/Seaborn output from the latest Visium run</CardDescription>
        </CardHeader>
        <CardContent>
          {data && data.n_runs > 0 ? (
            <img
              src={apiUrl("/evaluation/plot")}
              alt="Benchmark bar plot of silhouette, ARI, and stability"
              className="w-full rounded-lg border border-border bg-white"
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">Plot appears after a successful pipeline run</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
