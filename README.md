# BioAlign-ML: Multimodal Disease Subtype Discovery & Benchmarking Engine

BioAlign-ML is a production-grade backend orchestration pipeline and benchmarking framework designed to identify novel disease sub-types by aligning clinical cell morphology (Vision) with high-dimensional transcriptomic profiles (Tabular Genomic Data).

Most biomedical machine learning frameworks remain trapped in fragile, non-reproducible academic scripts. BioAlign-ML bridges the gap between research and production by enforcing data integrity gates, transactional logging, scalable data streaming, and automated evaluation metrics for multimodal foundation models.

## Key Architecture Features 

- **Strict Ingestion Gatekeeping:** Implements high-throughput data validation pipelines using Pydantic, handling high-dimensional genetic inputs with strict array-shape validation and memory-safe image processing chunks.
- **Relational Data Lineage:** Structured PostgreSQL schema designed to record model hyper-parameters, metrics benchmarks, and deterministic version hashes ensuring full experimental reproducibility.
- **Multimodal Evaluation Framework:** Custom modular evaluation suite computing Silhouette Width, Adjusted Rand Index (ARI), and bootstrap-based cluster stability metrics to test model alignment rigor.
- **Resilient Memory Management:** Built-in dynamic fallback handling for CUDA Out-Of-Memory (OOM) errors during heavy tensor computations.

## Tech Stack
- **Language:** Python 3.11+
- **Backend Framework:** FastAPI
- **Database:** PostgreSQL (with SQLAlchemy ORM)
- **Machine Learning Infrastructure:** PyTorch, Scikit-Learn, UMAP
- **Data Validation & Verification:** Pydantic v2

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11
- NVIDIA Driver / CUDA Toolkit (Optional for GPU acceleration)

### Installation & Local Setup

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/yourusername/BioAlign-ML.git](https://github.com/yourusername/BioAlign-ML.git)
   cd BioAlign-ML
