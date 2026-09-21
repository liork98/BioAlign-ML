"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Users, Dna, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiUrl, getExplorer, type Cluster, type ExplorerPayload } from "@/lib/api"

export function ClusterExplorerView() {
  const [payload, setPayload] = useState<ExplorerPayload | null>(null)
  const [selected, setSelected] = useState<Cluster | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await getExplorer()
        if (cancelled) return
        setPayload(data)
        setSelected((current) => current ?? data.clusters[0] ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load explorer")
      }
    }
    void load()
    const id = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const bounds = useMemo(() => {
    const points = payload?.points ?? []
    if (!points.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 }
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    }
  }, [payload])

  const project = (x: number, y: number) => {
    const spanX = bounds.maxX - bounds.minX || 1
    const spanY = bounds.maxY - bounds.minY || 1
    return {
      x: 4 + ((x - bounds.minX) / spanX) * 92,
      y: 4 + ((y - bounds.minY) / spanY) * 92,
    }
  }

  const colorFor = (cluster: number) =>
    payload?.clusters.find((c) => c.label === cluster)?.color ?? "#94a3b8"

  const selectedCluster = selected ?? payload?.clusters[0] ?? null
  const displayPoints = (payload?.points ?? []).slice(0, 4000)

  const exportCluster = async () => {
    if (!selectedCluster) return
    const response = await fetch(apiUrl(`/explorer/export/${selectedCluster.id}`))
    const json = await response.json()
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${selectedCluster.id}-alignment.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid-cols-[1fr_380px] gap-6 h-[calc(100vh-8rem)]">
      <Card className="border-border/50 flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {payload?.embedding_method === "umap" ? "UMAP Projection" : "2D Embedding"}
              </CardTitle>
              <CardDescription>
                {payload?.n_samples
                  ? `${payload.embedding_method} of Visium spots (n=${payload.n_samples.toLocaleString()})`
                  : "No embedding until the Visium pipeline completes"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {payload?.algorithm ?? "—"}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                n_neighbors: {payload?.n_neighbors ?? "—"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          {error && <p className="text-sm text-destructive mb-2">{error}</p>}
          <div className="relative h-full w-full rounded-lg border border-border bg-muted/10 overflow-hidden">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {displayPoints.map((point) => {
                const { x, y } = project(point.x, point.y)
                const active = selectedCluster?.label === point.cluster
                return (
                  <circle
                    key={point.barcode}
                    cx={x}
                    cy={y}
                    r={active ? 0.55 : 0.4}
                    fill={colorFor(point.cluster)}
                    opacity={active ? 0.95 : 0.55}
                  />
                )
              })}
            </svg>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono">
              {payload?.embedding_method === "pca" ? "PC 1" : "UMAP 1"}
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-mono">
              {payload?.embedding_method === "pca" ? "PC 2" : "UMAP 2"}
            </div>
            <div className="absolute right-4 top-4 rounded-lg bg-background/80 backdrop-blur-sm border border-border p-3 max-h-64 overflow-auto">
              <p className="text-xs font-medium text-foreground mb-2">Clusters</p>
              <div className="space-y-1.5">
                {(payload?.clusters ?? []).map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => setSelected(cluster)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left rounded px-1.5 py-0.5 transition-colors",
                      selectedCluster?.id === cluster.id ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cluster.color }} />
                    <span className="text-xs text-foreground truncate max-w-[120px]">{cluster.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 flex flex-col sticky top-0">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cluster Details</CardTitle>
              <CardDescription>Computed from Visium spots, not placeholders</CardDescription>
            </div>
            {selectedCluster && (
              <div
                className="h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                style={{ backgroundColor: selectedCluster.color, boxShadow: `0 0 12px ${selectedCluster.color}` }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {!selectedCluster ? (
            <p className="text-sm text-muted-foreground">Complete a pipeline run to inspect clusters.</p>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground">{selectedCluster.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Cluster ID: {selectedCluster.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Spot Count</span>
                  </div>
                  <p className="text-lg font-semibold font-mono">{selectedCluster.samples.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Mean silhouette</span>
                  </div>
                  <p className="text-lg font-semibold font-mono">{selectedCluster.mean_silhouette.toFixed(3)}</p>
                </div>
              </div>
              <Separator className="mb-6" />
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Dna className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Dominant Gene Markers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster.dominant_genes.map((gene) => (
                    <Badge
                      key={gene}
                      variant="outline"
                      className="font-mono text-xs bg-primary/5 border-primary/30 text-primary"
                    >
                      {gene}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-chart-2" />
                  <span className="text-sm font-medium text-foreground">UMAP compactness</span>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Mean distance to centroid</span>
                    <span className="text-sm font-semibold font-mono">
                      {selectedCluster.compactness.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Lower is tighter. Derived from the 2D embedding of this cluster&apos;s Visium spots.
                  </p>
                </div>
              </div>
              <div className="mt-auto space-y-2">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={exportCluster}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Alignment Metrics to JSON
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
