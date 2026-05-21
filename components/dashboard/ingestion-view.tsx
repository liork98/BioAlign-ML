"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

interface DropZoneProps {
  title: string
  description: string
  acceptedFormats: string
  icon: React.ReactNode
  onDrop?: (files: FileList) => void
}

function DropZone({ title, description, acceptedFormats, icon, onDrop }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files && onDrop) {
        onDrop(e.dataTransfer.files)
      }
    },
    [onDrop]
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
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10">
          <Upload className="h-8 w-8 text-primary animate-bounce" />
        </div>
      )}
    </div>
  )
}

const pipelineData = [
  {
    id: "TCGA-BH-A0B8",
    status: "pass",
    cudaUsage: 72,
    elapsedTime: "4m 23s",
  },
  {
    id: "TCGA-E2-A1LK",
    status: "pass",
    cudaUsage: 45,
    elapsedTime: "2m 11s",
  },
  {
    id: "TCGA-A2-A0T6",
    status: "fail",
    cudaUsage: 0,
    elapsedTime: "0m 58s",
  },
  {
    id: "TCGA-BH-A0DP",
    status: "pass",
    cudaUsage: 89,
    elapsedTime: "6m 47s",
  },
  {
    id: "TCGA-E2-A1LS",
    status: "pending",
    cudaUsage: 34,
    elapsedTime: "1m 02s",
  },
]

export function IngestionView() {
  return (
    <div className="space-y-6">
      {/* Upload Zones */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Pathology Image Stack</CardTitle>
            <CardDescription>High-resolution tissue imaging data</CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone
              title="Upload Pathology Images"
              description="Drag and drop your image stack here"
              acceptedFormats="TIFF, PNG, DICOM"
              icon={<FileImage className="h-6 w-6" />}
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Transcriptomic Profiles</CardTitle>
            <CardDescription>Gene expression and molecular data</CardDescription>
          </CardHeader>
          <CardContent>
            <DropZone
              title="Upload Transcriptomic Data"
              description="Drag and drop your profiles here"
              acceptedFormats="CSV, H5AD, MTX"
              icon={<FileSpreadsheet className="h-6 w-6" />}
            />
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Running Pipelines</CardTitle>
              <CardDescription>Real-time processing status for all active jobs</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono">
              {pipelineData.length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="text-muted-foreground">Sample ID</TableHead>
                <TableHead className="text-muted-foreground">Data Gate Status</TableHead>
                <TableHead className="text-muted-foreground">CUDA Memory Usage</TableHead>
                <TableHead className="text-muted-foreground text-right">Elapsed Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelineData.map((pipeline) => (
                <TableRow key={pipeline.id} className="border-border/30 hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{pipeline.id}</TableCell>
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
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={pipeline.cudaUsage}
                        className="h-2 w-24 bg-muted"
                      />
                      <span className="text-xs font-mono text-muted-foreground w-8">
                        {pipeline.cudaUsage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {pipeline.elapsedTime}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
