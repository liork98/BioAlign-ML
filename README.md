# BioAlign-ML: Multimodal Disease Subtype Discovery & Benchmarking Engine

BioAlign-ML is a production-grade backend orchestration pipeline and benchmarking framework designed to identify novel disease sub-types by aligning clinical cell morphology (Vision) with high-dimensional transcriptomic profiles (Tabular Genomic Data).

Most biomedical machine learning frameworks remain trapped in fragile, non-reproducible academic scripts. BioAlign-ML bridges the gap between research and production by enforcing data integrity gates, transactional logging, scalable data streaming, and automated evaluation metrics for multimodal foundation models.

## Dataset (no synthetic substitutes)

The end-to-end benchmark uses the public **10x Genomics Visium Spatial Gene Expression** dataset:

**Human Breast Cancer, Block A Section 1** (CC-BY 4.0)

- Histology: H&E tissue image (`tissue_hires_image.png`)
- Transcriptomics: filtered feature-barcode matrix (spots × genes)
- Alignment: each in-tissue spot is paired with a histology patch at its spatial coordinate

Source: [10x Genomics dataset page](https://www.10xgenomics.com/datasets/human-breast-cancer-block-a-section-1-1-standard-1-1-0)

First pipeline run downloads the matrix and spatial archive into `data/raw/` (gitignored). All silhouette, ARI, stability, marker-gene, and UMAP values are computed from this bundle and written to PostgreSQL.

## Key Architecture Features

- **Strict Ingestion Gatekeeping:** Pydantic manifests for expression shape, non-negative finite counts, and image geometry, plus SHA-256 hashes of the source files.
- **Relational Data Lineage:** PostgreSQL records hyperparameters, input hashes, per-algorithm metrics, cluster summaries, and UMAP coordinates.
- **Multimodal Evaluation:** Silhouette width, Adjusted Rand Index vs a KMeans reference, and bootstrap cluster stability.
- **CUDA OOM fallback:** Linear projection retries on CPU after emptying the CUDA cache.

## Tech Stack

- **Language:** Python 3.11+
- **Backend Framework:** FastAPI
- **Database:** PostgreSQL (SQLAlchemy 2.0)
- **Machine Learning:** PyTorch, Scikit-Learn, UMAP
- **Data Validation:** Pydantic v2
- **Frontend:** Next.js dashboard bound to live API responses

## Getting Started

### Prerequisites

- Docker & Docker Compose (recommended) **or** local Python 3.11 + PostgreSQL
- Node.js 20+ / pnpm for the dashboard
- NVIDIA Driver / CUDA Toolkit (optional)

### Installation & Local Setup

1. Clone the repository and copy environment defaults:

   ```bash
   git clone https://github.com/yourusername/BioAlign-ML.git
   cd BioAlign-ML
   cp .env.example .env
   ```

2. Start Postgres, API, and the Next.js app:

   ```bash
   docker compose up --build
   ```

   Dashboard: http://localhost:3000  
   API: http://localhost:8000/docs

3. In **Ingestion & Pipelines**, click **Run Visium pipeline**. The worker downloads the 10x bundle (first run only), validates it, clusters the multimodal embedding, and stores metrics. The evaluation and explorer views poll those rows — they do not use placeholder numbers.

### Backend only (no Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
cd backend
pytest
```

Point `DATABASE_URL` at Postgres or a local SQLite file for development.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Process + database ping |
| GET | `/metrics/summary` | Header bar totals from the latest run |
| POST | `/pipeline/run-public` | Queue Visium ingest + benchmark |
| POST | `/pipeline/run-public/sync` | Same job, blocking (CLI / tests) |
| GET | `/pipeline/jobs` | Ingestion gate results |
| GET | `/evaluation` | Silhouette, ARI, stability, run table |
| GET | `/evaluation/plot` | Matplotlib benchmark PNG |
| GET | `/explorer` | UMAP points, markers, compactness |
