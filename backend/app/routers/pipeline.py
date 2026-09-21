from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..db import get_engine, get_db
from ..models import PipelineJob
from ..schemas import PipelineJobOut
from ..services.pipeline import run_public_visium_pipeline

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


def _run_in_background() -> None:
    get_engine()
    from ..db import SessionLocal

    db = SessionLocal()
    try:
        run_public_visium_pipeline(db)
    finally:
        db.close()


@router.get("/jobs", response_model=list[PipelineJobOut])
def list_jobs(db: Session = Depends(get_db)) -> list[PipelineJob]:
    return db.query(PipelineJob).order_by(PipelineJob.id.desc()).limit(50).all()


@router.post("/run-public", response_model=PipelineJobOut)
def run_public_dataset(
    background: BackgroundTasks,
    db: Session = Depends(get_db),
) -> PipelineJob:
    pending = (
        db.query(PipelineJob)
        .filter(PipelineJob.status == "pending")
        .order_by(PipelineJob.id.desc())
        .first()
    )
    if pending:
        return pending
    job = PipelineJob(
        sample_id="V1_Breast_Cancer_Block_A_Section_1",
        status="pending",
        dataset_name="10x Genomics Visium Human Breast Cancer (Block A Section 1)",
        gate_message="Queued public Visium ingest",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    background.add_task(_run_in_background)
    return job


@router.post("/run-public/sync", response_model=PipelineJobOut)
def run_public_dataset_sync(db: Session = Depends(get_db)) -> PipelineJob:
    return run_public_visium_pipeline(db)


@router.post("/upload")
async def upload_modalities(
    images: list[UploadFile] | None = File(default=None),
    transcripts: list[UploadFile] | None = File(default=None),
) -> dict:
    """Accept user files but do not invent metrics. Public Visium remains the benchmark source."""
    n_img = len(images or [])
    n_tx = len(transcripts or [])
    if n_img == 0 and n_tx == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")
    return {
        "accepted_images": n_img,
        "accepted_transcripts": n_tx,
        "message": "Files received. Run the public 10x Visium pipeline for paired multimodal benchmarks.",
    }
