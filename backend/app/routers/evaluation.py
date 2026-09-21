from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ExperimentRun
from ..schemas import EvaluationSummary, ExperimentRunOut

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("", response_model=EvaluationSummary)
def evaluation_summary(db: Session = Depends(get_db)) -> EvaluationSummary:
    runs = db.query(ExperimentRun).order_by(ExperimentRun.created_at.asc()).all()
    if not runs:
        return EvaluationSummary(
            silhouette=None,
            silhouette_delta=None,
            ari=None,
            ari_delta=None,
            stability=None,
            n_runs=0,
            n_samples=0,
            runs=[],
        )
    latest_job_id = runs[-1].job_id
    job_runs = [r for r in runs if r.job_id == latest_job_id]
    baseline = next((r for r in job_runs if r.is_baseline), job_runs[0])
    primary = next((r for r in reversed(job_runs) if not r.is_baseline), job_runs[-1])
    return EvaluationSummary(
        silhouette=primary.silhouette,
        silhouette_delta=primary.silhouette - baseline.silhouette,
        ari=primary.ari,
        ari_delta=primary.ari - baseline.ari,
        stability=primary.stability,
        n_runs=len(job_runs),
        n_samples=primary.n_samples,
        runs=[ExperimentRunOut.model_validate(r) for r in job_runs],
    )


@router.get("/plot")
def evaluation_plot(db: Session = Depends(get_db)) -> FileResponse:
    run = (
        db.query(ExperimentRun)
        .filter(ExperimentRun.plot_path.isnot(None))
        .order_by(ExperimentRun.id.asc())
        .first()
    )
    if run is None or not run.plot_path:
        raise HTTPException(status_code=404, detail="No benchmark plot yet")
    path = Path(run.plot_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Plot file missing on disk")
    return FileResponse(path, media_type="image/png")
