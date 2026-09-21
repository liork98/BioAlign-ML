from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db, ping_db
from ..models import ExperimentRun, PipelineJob
from ..schemas import DashboardMetrics, HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    db_ok = ping_db()
    latest = db.query(PipelineJob).order_by(PipelineJob.id.desc()).first()
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        database="connected" if db_ok else "disconnected",
        device=settings.device,
        dataset=latest.dataset_name if latest else None,
    )


@router.get("/metrics/summary", response_model=DashboardMetrics)
def dashboard_metrics(db: Session = Depends(get_db)) -> DashboardMetrics:
    db_ok = ping_db()
    active = db.query(PipelineJob).filter(PipelineJob.status == "pending").count()
    latest_job = db.query(PipelineJob).order_by(PipelineJob.id.desc()).first()
    latest_run = (
        db.query(ExperimentRun).order_by(ExperimentRun.created_at.desc()).first()
    )
    total = latest_run.n_samples if latest_run else 0
    health = "operational" if db_ok else "down"
    if db_ok and latest_job and latest_job.status == "fail":
        health = "degraded"
    return DashboardMetrics(
        system_health=health,
        database="connected" if db_ok else "disconnected",
        jobs_active=active,
        total_samples=total,
        last_ari=latest_run.ari if latest_run else None,
        last_stability=latest_run.stability if latest_run else None,
        dataset_name=latest_job.dataset_name if latest_job else None,
    )
