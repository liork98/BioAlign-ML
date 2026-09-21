from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .routers.evaluation import router as evaluation_router
from .routers.explorer import router as explorer_router
from .routers.health import router as health_router
from .routers.pipeline import router as pipeline_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="BioAlign-ML Backend Engine",
    description="Multimodal Visium (H&E + spatial transcriptomics) ingestion, clustering, and benchmarking.",
    version="2.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(pipeline_router)
app.include_router(evaluation_router)
app.include_router(explorer_router)
