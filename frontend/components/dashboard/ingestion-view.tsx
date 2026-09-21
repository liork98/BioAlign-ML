"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, FileImage, FileSpreadsheet, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiUrl, formatElapsed, getJobs, runPublicDataset, type PipelineJob } from "@/lib/api"

interface DropZoneProps {
  title: string
  description: string
  acceptedFormats: string
  icon: React.ReactNode
  fieldName: string
}

function DropZone({ title, description, acceptedFormats, icon, fieldName }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const upload = useCallback(async (files: FileList) => {
    const body = new FormData()
    Array.from(files).forEach((file) => body.append(fieldName, file))
    const response = await fetch(apiUrl("/pipeline/upload"), { method: "POST", body })
    const payload = await response.json()
    setMessage(payload.message ?? "Upload recorded")
  }, [fieldName])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        void upload(e.dataTransfer.files)
      }
    },
    [upload]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
          isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="mt-1 text-xs text-muted-foreground">{description}</span>
      <span className="mt-2 rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
        {acceptedFormats}
      </span>
      {message && <span className="mt-2 px-3 text-center text-xs text-muted-foreground">{message}</span>}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10">
          <Upload className="h-8 w-8 text-primary animate-bounce" />
        </div>
      )}
    </div>
  )
}

export function IngestionView() {
  const [jobs, setJobs] = useState<PipelineJob[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setJobs(await getJobs())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs")
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 3000)
    return () => clearInterval(id)
  }, [refresh])

  const startPublic = async () => {
    setBusy(true)
    setError(null)
    try {
      await runPublicDataset()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start pipeline")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm font-medium text-foreground">Public benchmark dataset</p>
            <p className="mt-1 text-xs text-muted-foreground">
              10x Genomics Visium Human Breast Cancer Block A Section 1 — paired H&amp;E histology and
              spatial transcriptomics. Metrics are computed from this download, not placeholders.
            </p>
          </div>
          <Button onClick={startPublic} disabled={busy}>
            {busy ? "Starting…" : "Run Visium pipeline"}
          </Button>
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Pathology Image Stack</CardTitle>
            <CardDescription>Optional extra images (TIFF, PNG, DICOM)</CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone
              title="Upload Pathology Images"
              description="Paired Visium image is loaded by the public pipeline"
              acceptedFormats="TIFF, PNG, DICOM"
              fieldName="images"
              icon={<FileImage className="h-6 w-6" />}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Transcriptomic Profiles</CardTitle>
            <CardDescription>Optional extra matrices (CSV, H5AD, MTX)</CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone
              title="Upload Transcriptomic Data"
              description="10x H5 counts come from the Visium bundle"
              acceptedFormats="CSV, H5AD, MTX"
              fieldName="transcripts"
              icon={<FileSpreadsheet className="h-6 w-6" />}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Running Pipelines</CardTitle>
              <CardDescription>Jobs persisted in PostgreSQL after the ingestion gate</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {jobs.length} Jobs
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pipeline jobs yet. Run the Visium ingest to populate this table.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-muted-foreground">Sample ID</TableHead>
                  <TableHead className="text-muted-foreground">Data Gate Status</TableHead>
                  <TableHead className="text-muted-foreground">Spots × genes</TableHead>
                  <TableHead className="text-muted-foreground">CUDA Memory Usage</TableHead>
                  <TableHead className="text-muted-foreground text-right">Elapsed Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((pipeline) => (
                  <TableRow key={pipeline.id} className="border-border/30 hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{pipeline.sample_id}</TableCell>
                    <TableCell>
                      {pipeline.status === "pass" && (
                        <Badge className="bg-success/15 text-success border-success/30 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Pass
                        </Badge>
                      )}
                      {pipeline.status === "fail" && (
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
                          <XCircle className="h-3 w-3" />
                          Fail
                        </Badge>
                      )}
                      {pipeline.status === "pending" && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {pipeline.n_spots.toLocaleString()} × {pipeline.n_genes.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={pipeline.cuda_usage_pct} className="h-2 w-24 bg-muted" />
                        <span className="text-xs font-mono text-muted-foreground w-8">
                          {Math.round(pipeline.cuda_usage_pct)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatElapsed(pipeline.elapsed_ms)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
