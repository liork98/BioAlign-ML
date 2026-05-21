"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, ExternalLink, Users, Dna, Activity, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Cluster {
  id: string
  name: string
  color: string
  samples: number
  dominantGenes: string[]
  survivalCorrelation: number
  x: number
  y: number
  radius: number
}

const clusters: Cluster[] = [
  {
    id: "cluster-1",
    name: "Basal-like A",
    color: "#0ea5e9",
    samples: 3420,
    dominantGenes: ["BRCA1", "TP53", "MYC", "EGFR"],
    survivalCorrelation: 0.67,
    x: 25,
    y: 30,
    radius: 18,
  },
  {
    id: "cluster-2",
    name: "Luminal B+",
    color: "#22c55e",
    samples: 5180,
    dominantGenes: ["ESR1", "PGR", "ERBB2", "GATA3"],
    survivalCorrelation: 0.82,
    x: 60,
    y: 25,
    radius: 22,
  },
  {
    id: "cluster-3",
    name: "HER2-enriched",
    color: "#f59e0b",
    samples: 2840,
    dominantGenes: ["ERBB2", "GRB7", "STARD3", "MIEN1"],
    survivalCorrelation: 0.54,
    x: 75,
    y: 55,
    radius: 16,
  },
  {
    id: "cluster-4",
    name: "Claudin-low",
    color: "#ef4444",
    samples: 1920,
    dominantGenes: ["VIM", "CDH1", "SNAI2", "ZEB1"],
    survivalCorrelation: 0.41,
    x: 35,
    y: 65,
    radius: 14,
  },
  {
    id: "cluster-5",
    name: "Normal-like",
    color: "#a855f7",
    samples: 4280,
    dominantGenes: ["FOXA1", "XBP1", "TFF3", "CCND1"],
    survivalCorrelation: 0.89,
    x: 55,
    y: 70,
    radius: 20,
  },
  {
    id: "cluster-6",
    name: "Novel Subtype X",
    color: "#06b6d4",
    samples: 1450,
    dominantGenes: ["PIK3CA", "AKT1", "PTEN", "FOXO3"],
    survivalCorrelation: 0.62,
    x: 20,
    y: 50,
    radius: 12,
  },
  {
    id: "cluster-7",
    name: "Immunogenic",
    color: "#ec4899",
    samples: 2760,
    dominantGenes: ["CD8A", "PDCD1", "CTLA4", "LAG3"],
    survivalCorrelation: 0.75,
    x: 45,
    y: 40,
    radius: 15,
  },
]

export function ClusterExplorerView() {
  const [selectedCluster, setSelectedCluster] = useState<Cluster>(clusters[0])

  return (
    <div className="grid grid-cols-[1fr_380px] gap-6 h-[calc(100vh-8rem)]">
      {/* UMAP Scatter Plot */}
      <Card className="border-border/50 flex flex-col">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">UMAP Projection</CardTitle>
              <CardDescription>2D embedding of cancer subtype clusters (n=21,850 samples)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                perplexity: 30
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                n_neighbors: 15
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <div className="relative h-full w-full rounded-lg border border-border bg-muted/10 overflow-hidden">
            {/* Grid lines */}
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/30" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* Scatter points */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {/* Cluster blobs with glow effect */}
              <defs>
                {clusters.map((cluster) => (
                  <filter key={`glow-${cluster.id}`} id={`glow-${cluster.id}`}>
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
              </defs>
              
              {clusters.map((cluster) => (
                <g key={cluster.id}>
                  {/* Outer glow */}
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={cluster.radius + 2}
                    fill={cluster.color}
                    opacity={selectedCluster.id === cluster.id ? 0.3 : 0.15}
                    className="transition-opacity duration-200"
                  />
                  {/* Main cluster */}
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={cluster.radius}
                    fill={cluster.color}
                    opacity={selectedCluster.id === cluster.id ? 0.8 : 0.5}
                    className="cursor-pointer transition-all duration-200 hover:opacity-80"
                    onClick={() => setSelectedCluster(cluster)}
                    filter={selectedCluster.id === cluster.id ? `url(#glow-${cluster.id})` : undefined}
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={cluster.x - cluster.radius * 0.2}
                    cy={cluster.y - cluster.radius * 0.2}
                    r={cluster.radius * 0.4}
                    fill="white"
                    opacity={0.15}
                  />
                  {/* Sample scatter dots */}
                  {Array.from({ length: 20 }).map((_, i) => {
                    const angle = (i / 20) * Math.PI * 2
                    const distance = Math.random() * cluster.radius * 0.8
                    const dotX = cluster.x + Math.cos(angle) * distance
                    const dotY = cluster.y + Math.sin(angle) * distance
                    return (
                      <circle
                        key={`${cluster.id}-dot-${i}`}
                        cx={dotX}
                        cy={dotY}
                        r={0.5}
                        fill="white"
                        opacity={0.6}
                      />
                    )
                  })}
                </g>
              ))}
            </svg>

            {/* Axis labels */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-mono">
              UMAP 1
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-mono">
              UMAP 2
            </div>

            {/* Legend */}
            <div className="absolute right-4 top-4 rounded-lg bg-background/80 backdrop-blur-sm border border-border p-3">
              <p className="text-xs font-medium text-foreground mb-2">Clusters</p>
              <div className="space-y-1.5">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster)}
                    className={cn(
                      "flex items-center gap-2 w-full text-left rounded px-1.5 py-0.5 transition-colors",
                      selectedCluster.id === cluster.id ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <span className="text-xs text-foreground truncate max-w-[100px]">{cluster.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Panel */}
      <Card className="border-border/50 flex flex-col sticky top-0">
        <CardHeader className="flex-none pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Cluster Details</CardTitle>
              <CardDescription>Selected subtype metadata</CardDescription>
            </div>
            <div
              className="h-4 w-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
              style={{ backgroundColor: selectedCluster.color, boxShadow: `0 0 12px ${selectedCluster.color}` }}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Cluster Name */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground">{selectedCluster.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">Cluster ID: {selectedCluster.id}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sample Count</span>
              </div>
              <p className="text-lg font-semibold font-mono">{selectedCluster.samples.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Survival Corr.</span>
              </div>
              <p className="text-lg font-semibold font-mono">{selectedCluster.survivalCorrelation.toFixed(2)}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Dominant Gene Markers */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Dna className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Dominant Gene Markers</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCluster.dominantGenes.map((gene) => (
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

          {/* Patient Cohort Survival */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-chart-2" />
              <span className="text-sm font-medium text-foreground">Patient Cohort Survival Rate</span>
            </div>
            <div className="rounded-lg bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">5-year survival correlation</span>
                <span className="text-sm font-semibold font-mono">
                  {(selectedCluster.survivalCorrelation * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${selectedCluster.survivalCorrelation * 100}%`,
                    backgroundColor: selectedCluster.color,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on TCGA clinical metadata correlation analysis
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto space-y-2">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Download className="h-4 w-4 mr-2" />
              Export Alignment Metrics to JSON
            </Button>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Analysis
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
