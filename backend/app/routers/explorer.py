from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import ClusterSummary, EmbeddingPoint, ExperimentRun
from ..schemas import ClusterOut, ExplorerPayload, UmapPoint

router = APIRouter(prefix="/explorer", tags=["explorer"])


def _latest_non_baseline(db: Session) -> ExperimentRun | None:
    run = (
        db.query(ExperimentRun)
        .filter(ExperimentRun.is_baseline.is_(False))
        .order_by(ExperimentRun.id.desc())
        .first()
    )
    if run:
        return run
    return db.query(ExperimentRun).order_by(ExperimentRun.id.desc()).first()


@router.get("", response_model=ExplorerPayload)
def explorer(db: Session = Depends(get_db)) -> ExplorerPayload:
    run = _latest_non_baseline(db)
    if run is None:
        return ExplorerPayload(
            run_id=None,
            algorithm=None,
            embedding_method=None,
            n_neighbors=settings.umap_neighbors,
            n_samples=0,
            clusters=[],
            points=[],
        )
    clusters = (
        db.query(ClusterSummary).filter(ClusterSummary.run_id == run.id).order_by(ClusterSummary.cluster_label).all()
    )
    points = db.query(EmbeddingPoint).filter(EmbeddingPoint.run_id == run.id).all()
    xs = [c.centroid_umap_x for c in clusters] or [0.0]
    ys = [c.centroid_umap_y for c in clusters] or [0.0]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    span_x = (max_x - min_x) or 1.0
    span_y = (max_y - min_y) or 1.0

    def _norm(val: float, lo: float, span: float) -> float:
        return 8 + 84 * ((val - lo) / span)

    cluster_out = [
        ClusterOut(
            id=f"cluster-{c.cluster_label}",
            label=c.cluster_label,
            name=c.name,
            color=c.color,
            samples=c.n_samples,
            dominant_genes=list(c.marker_genes or []),
            mean_silhouette=c.mean_silhouette,
            compactness=c.compactness,
            x=_norm(c.centroid_umap_x, min_x, span_x),
            y=_norm(c.centroid_umap_y, min_y, span_y),
        )
        for c in clusters
    ]
    point_out = [
        UmapPoint(barcode=p.barcode, x=p.umap_x, y=p.umap_y, cluster=p.cluster)
        for p in points
    ]
    return ExplorerPayload(
        run_id=run.id,
        algorithm=run.algorithm,
        embedding_method=run.embedding_method,
        n_neighbors=settings.umap_neighbors,
        n_samples=run.n_samples,
        clusters=cluster_out,
        points=point_out,
    )


@router.get("/export/{cluster_id}")
def export_cluster(cluster_id: str, db: Session = Depends(get_db)) -> JSONResponse:
    run = _latest_non_baseline(db)
    if run is None:
        raise HTTPException(status_code=404, detail="No completed run")
    label = int(cluster_id.replace("cluster-", ""))
    cluster = (
        db.query(ClusterSummary)
        .filter(ClusterSummary.run_id == run.id, ClusterSummary.cluster_label == label)
        .first()
    )
    if cluster is None:
        raise HTTPException(status_code=404, detail="Cluster not found")
    payload = {
        "run_id": run.id,
        "algorithm": run.algorithm,
        "input_hash": run.input_hash,
        "cluster_label": cluster.cluster_label,
        "name": cluster.name,
        "n_samples": cluster.n_samples,
        "marker_genes": cluster.marker_genes,
        "mean_silhouette": cluster.mean_silhouette,
        "compactness": cluster.compactness,
        "silhouette": run.silhouette,
        "ari": run.ari,
        "stability": run.stability,
    }
    return JSONResponse(content=json.loads(json.dumps(payload)))
