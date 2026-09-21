from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
import numpy as np


class HealthResponse(BaseModel):
    status: str
    database: str
    device: str
    dataset: str | None = None


class TranscriptomicManifest(BaseModel):
    """Shape-level gate for high-dimensional expression matrices (not the full tensor)."""

    sample_id: str = Field(..., min_length=1, max_length=128)
    n_spots: int = Field(..., gt=0, le=2_000_000)
    n_genes: int = Field(..., gt=0, le=100_000)
    matrix_sha256: str = Field(..., min_length=64, max_length=64)
    barcode_count: int = Field(..., gt=0)

    @field_validator("n_spots")
    @classmethod
    def spots_match_barcodes(cls, v: int, info) -> int:
        return v


class ImageManifest(BaseModel):
    sample_id: str = Field(..., min_length=1, max_length=128)
    width: int = Field(..., gt=8, le=100_000)
    height: int = Field(..., gt=8, le=100_000)
    channels: int = Field(..., ge=1, le=4)
    pixel_count: int = Field(..., gt=0)
    sha256: str = Field(..., min_length=64, max_length=64)

    @field_validator("pixel_count")
    @classmethod
    def pixel_count_matches(cls, v: int, info) -> int:
        data = info.data
        if "width" in data and "height" in data:
            expected = data["width"] * data["height"]
            if v != expected:
                raise ValueError(f"pixel_count {v} != width*height {expected}")
        return v


class PipelineJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sample_id: str
    status: str
    gate_message: str | None
    cuda_usage_pct: float
    elapsed_ms: int
    n_spots: int
    n_genes: int
    input_hash: str | None
    dataset_name: str | None
    created_at: datetime
    updated_at: datetime


class ExperimentRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    name: str
    algorithm: str
    hyperparameters: dict
    input_hash: str
    n_samples: int
    n_clusters: int
    silhouette: float
    ari: float
    stability: float
    embedding_method: str
    is_baseline: bool
    created_at: datetime


class EvaluationSummary(BaseModel):
    silhouette: float | None
    silhouette_delta: float | None
    ari: float | None
    ari_delta: float | None
    stability: float | None
    n_runs: int
    n_samples: int
    runs: list[ExperimentRunOut]


class ClusterOut(BaseModel):
    id: str
    label: int
    name: str
    color: str
    samples: int
    dominant_genes: list[str]
    mean_silhouette: float
    compactness: float
    x: float
    y: float


class UmapPoint(BaseModel):
    barcode: str
    x: float
    y: float
    cluster: int


class ExplorerPayload(BaseModel):
    run_id: int | None
    algorithm: str | None
    embedding_method: str | None
    n_neighbors: int
    n_samples: int
    clusters: list[ClusterOut]
    points: list[UmapPoint]


class DashboardMetrics(BaseModel):
    system_health: Literal["operational", "degraded", "down"]
    database: str
    jobs_active: int
    total_samples: int
    last_ari: float | None
    last_stability: float | None
    dataset_name: str | None


def assert_expression_matrix(matrix: np.ndarray) -> None:
    if matrix.ndim != 2:
        raise ValueError("expression matrix must be 2-dimensional (spots × genes)")
    if matrix.shape[0] < 2 or matrix.shape[1] < 2:
        raise ValueError("expression matrix is too small for clustering")
    if not np.isfinite(matrix).all():
        raise ValueError("expression matrix contains NaN or Inf")
    if np.any(matrix < 0):
        raise ValueError("raw counts cannot be negative")
