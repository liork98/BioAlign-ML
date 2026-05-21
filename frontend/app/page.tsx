"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MetricBar } from "@/components/dashboard/metric-bar"
import { IngestionView } from "@/components/dashboard/ingestion-view"
import { EvaluationView } from "@/components/dashboard/evaluation-view"
import { ClusterExplorerView } from "@/components/dashboard/cluster-explorer-view"

type View = "ingestion" | "evaluation" | "explorer"

const viewTitles: Record<View, { title: string; description: string }> = {
  ingestion: {
    title: "Ingestion & Pipelines",
    description: "Upload pathology images and transcriptomic profiles for automated processing",
  },
  evaluation: {
    title: "Model Evaluation",
    description: "Benchmark clustering performance and compare model runs",
  },
  explorer: {
    title: "Subtype Cluster Explorer",
    description: "Interactive UMAP visualization of discovered cancer subtypes",
  },
}

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<View>("ingestion")

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Top Metric Bar */}
        <MetricBar />

        {/* Content Area */}
        <main className="flex-1 p-6">
          {/* View Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">{viewTitles[currentView].title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{viewTitles[currentView].description}</p>
          </div>

          {/* Dynamic View Content */}
          {currentView === "ingestion" && <IngestionView />}
          {currentView === "evaluation" && <EvaluationView />}
          {currentView === "explorer" && <ClusterExplorerView />}
        </main>
      </div>
    </div>
  )
}
