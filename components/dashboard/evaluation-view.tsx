"use client"

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

const modelRuns = [
  {
    id: "run-2024-001",
    name: "Baseline UMAP + KMeans",
    date: "2024-03-15",
    silhouette: 0.62,
    ari: 0.78,
    clusters: 5,
    status: "baseline",
  },
  {
    id: "run-2024-002",
    name: "Leiden + PAGA",
    date: "2024-03-18",
    silhouette: 0.68,
    ari: 0.84,
    clusters: 7,
    status: "improvement",
  },
  {
    id: "run-2024-003",
    name: "Spectral + Hierarchical",
    date: "2024-03-20",
    silhouette: 0.65,
    ari: 0.81,
    clusters: 6,
    status: "regression",
  },
  {
    id: "run-2024-004",
    name: "Deep Embedding + GMM",
    date: "2024-03-22",
    silhouette: 0.71,
    ari: 0.87,
    clusters: 8,
    status: "improvement",
  },
]

export function EvaluationView() {
  return (
    <div className="space-y-6">
      {/* Statistical Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Silhouette Width</p>
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">0.68</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+0.06 vs baseline</span>
                </div>
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
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">94.2%</p>
                <p className="mt-2 text-xs text-muted-foreground">via Bootstrapping</p>
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
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">0.84</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+0.06 improvement</span>
                </div>
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
                <p className="mt-1 text-2xl font-semibold font-mono text-foreground">47</p>
                <p className="mt-2 text-xs text-muted-foreground">This month</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <BarChart3 className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Model Run Comparison</CardTitle>
              <CardDescription>Performance metrics across different clustering approaches</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {modelRuns.length} Runs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-muted-foreground">Run ID</TableHead>
                <TableHead className="text-muted-foreground">Model Configuration</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground text-center">Silhouette</TableHead>
                <TableHead className="text-muted-foreground text-center">ARI</TableHead>
                <TableHead className="text-muted-foreground text-center">Clusters</TableHead>
                <TableHead className="text-muted-foreground text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelRuns.map((run) => (
                <TableRow key={run.id} className="border-border/30 hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{run.id}</TableCell>
                  <TableCell className="font-medium text-sm">{run.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{run.date}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{run.silhouette.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{run.ari.toFixed(2)}</TableCell>
                  <TableCell className="text-center font-mono text-sm">{run.clusters}</TableCell>
                  <TableCell className="text-right">
                    {run.status === "baseline" && (
                      <Badge variant="secondary" className="text-xs">Baseline</Badge>
                    )}
                    {run.status === "improvement" && (
                      <Badge className="bg-success/15 text-success border-success/30 text-xs gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Improved
                      </Badge>
                    )}
                    {run.status === "regression" && (
                      <Badge className="bg-warning/15 text-warning border-warning/30 text-xs gap-1">
                        <ArrowDownRight className="h-3 w-3" />
                        Regression
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visualization Placeholder */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Benchmark Visualization</CardTitle>
          <CardDescription>Matplotlib/Seaborn plot output from latest model run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                <BarChart3 className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Plot Visualization Area</p>
                <p className="text-xs text-muted-foreground mt-1">Matplotlib/Seaborn output renders here</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
