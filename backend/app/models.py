from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class PipelineJob(Base):
    __tablename__ = "pipeline_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sample_id: Mapped[str] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    gate_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    cuda_usage_pct: Mapped[float] = mapped_column(Float, default=0.0)
    elapsed_ms: Mapped[int] = mapped_column(Integer, default=0)
    n_spots: Mapped[int] = mapped_column(Integer, default=0)
    n_genes: Mapped[int] = mapped_column(Integer, default=0)
    input_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    dataset_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    runs: Mapped[list["ExperimentRun"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("pipeline_jobs.id"), index=True)
    name: Mapped[str] = mapped_column(String(128))
    algorithm: Mapped[str] = mapped_column(String(64))
    hyperparameters: Mapped[dict] = mapped_column(JSON, default=dict)
    input_hash: Mapped[str] = mapped_column(String(64))
    n_samples: Mapped[int] = mapped_column(Integer)
    n_clusters: Mapped[int] = mapped_column(Integer)
    silhouette: Mapped[float] = mapped_column(Float)
    ari: Mapped[float] = mapped_column(Float)
    stability: Mapped[float] = mapped_column(Float)
    embedding_method: Mapped[str] = mapped_column(String(32), default="umap")
    is_baseline: Mapped[bool] = mapped_column(Boolean, default=False)
    plot_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job: Mapped[PipelineJob] = relationship(back_populates="runs")
    clusters: Mapped[list["ClusterSummary"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )
    points: Mapped[list["EmbeddingPoint"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )


class ClusterSummary(Base):
    __tablename__ = "cluster_summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("experiment_runs.id"), index=True)
    cluster_label: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(64))
    n_samples: Mapped[int] = mapped_column(Integer)
    marker_genes: Mapped[list] = mapped_column(JSON, default=list)
    mean_silhouette: Mapped[float] = mapped_column(Float)
    compactness: Mapped[float] = mapped_column(Float)
    centroid_umap_x: Mapped[float] = mapped_column(Float)
    centroid_umap_y: Mapped[float] = mapped_column(Float)
    color: Mapped[str] = mapped_column(String(16))

    run: Mapped[ExperimentRun] = relationship(back_populates="clusters")


class EmbeddingPoint(Base):
    __tablename__ = "embedding_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("experiment_runs.id"), index=True)
    barcode: Mapped[str] = mapped_column(String(64), index=True)
    umap_x: Mapped[float] = mapped_column(Float)
    umap_y: Mapped[float] = mapped_column(Float)
    cluster: Mapped[int] = mapped_column(Integer)

    run: Mapped[ExperimentRun] = relationship(back_populates="points")
