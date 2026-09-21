from __future__ import annotations

import logging
import time
from datetime import datetime

from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score
from sqlalchemy.orm import Session

from ..config import settings
from ..models import ClusterSummary, EmbeddingPoint, ExperimentRun, PipelineJob
from .clustering import (
    bootstrap_stability,
    cluster_algorithms,
    cluster_compactness,
    fit_labels,
    per_cluster_silhouette,
    silhouette_safe,
    top_marker_genes,
    two_d_embedding,
)
from .features import multimodal_embedding
from .oom import cuda_memory_pct, resolve_device
from .plots import write_benchmark_plot, write_umap_plot
from .visium import ensure_visium_bundle

logger = logging.getLogger(__name__)

CLUSTER_COLORS = [
    "#0ea5e9",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
    "#f97316",
    "#6366f1",
]


def _get_or_create_job(db: Session, sample_id: str) -> PipelineJob:
    job = (
        db.query(PipelineJob)
        .filter(PipelineJob.sample_id == sample_id)
        .order_by(PipelineJob.id.desc())
        .first()
    )
    if job and job.status == "pending":
        return job
    job = PipelineJob(sample_id=sample_id, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def run_public_visium_pipeline(db: Session) -> PipelineJob:
    started = time.perf_counter()
    sample_id = settings.visium_sample_id
    job = _get_or_create_job(db, sample_id)
    job.status = "pending"
    job.gate_message = "Downloading and validating 10x Visium bundle"
    job.cuda_usage_pct = cuda_memory_pct(resolve_device(settings.device))
    db.commit()

    try:
        bundle = ensure_visium_bundle()
        job.dataset_name = bundle.dataset_name
        job.n_spots = int(bundle.counts.shape[0])
        job.n_genes = int(bundle.counts.shape[1])
        job.input_hash = bundle.input_hash
        job.gate_message = "Ingestion gate passed (expression shape + histology image)"
        db.commit()

        features, log_hvg, hvg_idx = multimodal_embedding(bundle)
        genes = bundle.gene_names[hvg_idx]
        coords, embed_method = two_d_embedding(features)
        n_clusters = min(settings.n_clusters, max(2, features.shape[0] // 50))

        reference = KMeans(
            n_clusters=n_clusters, n_init=10, random_state=settings.random_state
        ).fit_predict(features)

        existing_runs = db.query(ExperimentRun).filter(ExperimentRun.job_id == job.id).all()
        for existing in existing_runs:
            db.delete(existing)
        db.commit()

        run_rows: list[ExperimentRun] = []
        names: list[str] = []
        sils: list[float] = []
        aris: list[float] = []
        stabs: list[float] = []

        for i, (name, algo, model) in enumerate(cluster_algorithms(n_clusters, features.shape[0])):
            labels = fit_labels(model, features)
            sil = silhouette_safe(features, labels)
            ari = float(adjusted_rand_score(reference, labels))
            stab = bootstrap_stability(features, labels, n_clusters)
            plot_dir = settings.data_dir / "processed" / sample_id
            umap_path = write_umap_plot(
                plot_dir / f"umap_{algo}.png",
                coords,
                labels,
                f"{name} ({embed_method})",
            )
            run = ExperimentRun(
                job_id=job.id,
                name=name,
                algorithm=algo,
                hyperparameters={
                    "n_clusters": int(len(set(labels))),
                    "hvg": settings.hvg_count,
                    "pca": settings.pca_components,
                    "umap_neighbors": settings.umap_neighbors,
                    "random_state": settings.random_state,
                },
                input_hash=bundle.input_hash,
                n_samples=int(features.shape[0]),
                n_clusters=int(len(set(labels))),
                silhouette=sil,
                ari=ari,
                stability=stab,
                embedding_method=embed_method,
                is_baseline=algo == "kmeans",
                plot_path=str(umap_path),
            )
            db.add(run)
            db.flush()

            sil_map = per_cluster_silhouette(features, labels)
            compact = cluster_compactness(coords, labels)
            for label in sorted(set(int(x) for x in labels)):
                pts = coords[labels == label]
                centroid = pts.mean(axis=0)
                db.add(
                    ClusterSummary(
                        run_id=run.id,
                        cluster_label=label,
                        name=f"Spatial subtype {label + 1}",
                        n_samples=int((labels == label).sum()),
                        marker_genes=top_marker_genes(log_hvg, genes, labels, label),
                        mean_silhouette=sil_map.get(label, 0.0),
                        compactness=compact.get(label, 0.0),
                        centroid_umap_x=float(centroid[0]),
                        centroid_umap_y=float(centroid[1]),
                        color=CLUSTER_COLORS[label % len(CLUSTER_COLORS)],
                    )
                )

            points = [
                EmbeddingPoint(
                    run_id=run.id,
                    barcode=str(bundle.barcodes[j]),
                    umap_x=float(coords[j, 0]),
                    umap_y=float(coords[j, 1]),
                    cluster=int(labels[j]),
                )
                for j in range(len(labels))
            ]
            db.add_all(points)
            run_rows.append(run)
            names.append(name)
            sils.append(sil)
            aris.append(ari)
            stabs.append(stab)
            logger.info("Stored run %s sil=%.4f ari=%.4f stab=%.4f", name, sil, ari, stab)

        bench = write_benchmark_plot(
            settings.data_dir / "processed" / sample_id / "benchmark.png",
            names,
            sils,
            aris,
            stabs,
        )
        if run_rows:
            run_rows[0].plot_path = str(bench)

        job.status = "pass"
        job.cuda_usage_pct = cuda_memory_pct(resolve_device(settings.device))
        job.elapsed_ms = int((time.perf_counter() - started) * 1000)
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
        return job
    except Exception as exc:
        logger.exception("Visium pipeline failed")
        job.status = "fail"
        job.gate_message = str(exc)
        job.elapsed_ms = int((time.perf_counter() - started) * 1000)
        job.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(job)
        return job
