"use client"

import { cn } from "@/lib/utils"
import {
  Database,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Microscope,
  Network,
  Settings,
} from "lucide-react"

type View = "ingestion" | "evaluation" | "explorer"

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
}

const navItems = [
  {
    id: "ingestion" as const,
    label: "Ingestion & Pipelines",
    icon: Database,
    description: "Data upload and processing",
  },
  {
    id: "evaluation" as const,
    label: "Model Evaluation",
    icon: LineChart,
    description: "Benchmarks & metrics",
  },
  {
    id: "explorer" as const,
    label: "Subtype Cluster Explorer",
    icon: Network,
    description: "UMAP visualization",
  },
]

export function DashboardSidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">BioAlign-ML</span>
          <span className="text-xs text-muted-foreground">Enterprise v2.4</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Pipeline Views
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Microscope className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Connected Systems</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md bg-sidebar-accent/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="text-xs text-sidebar-foreground">CUDA Cluster</span>
            </div>
            <span className="text-xs text-success">Online</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-sidebar-accent/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span className="text-xs text-sidebar-foreground">Genomics DB</span>
            </div>
            <span className="text-xs text-success">Synced</span>
          </div>
        </div>
        <button className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
          <Settings className="h-4 w-4" />
          <span className="text-xs">System Settings</span>
        </button>
      </div>
    </aside>
  )
}
