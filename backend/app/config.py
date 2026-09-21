import os
from pathlib import Path

from dotenv import load_dotenv

_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_REPO_ROOT = _BACKEND_DIR.parent

load_dotenv(_REPO_ROOT / ".env")
load_dotenv(_BACKEND_DIR / ".env", override=True)


def _csv(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [part.strip() for part in raw.split(",") if part.strip()]


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://bioalign:bioalign@localhost:5432/bioalign",
        )
        self.postgres_user = os.getenv("POSTGRES_USER", "bioalign")
        self.postgres_password = os.getenv("POSTGRES_PASSWORD", "bioalign")
        self.postgres_db = os.getenv("POSTGRES_DB", "bioalign")
        self.postgres_host = os.getenv("POSTGRES_HOST", "localhost")
        self.postgres_port = int(os.getenv("POSTGRES_PORT", "5432"))
        self.api_host = os.getenv("API_HOST", "0.0.0.0")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.api_reload = os.getenv("API_RELOAD", "true").lower() in {"1", "true", "yes"}
        self.cors_origins = _csv("CORS_ORIGINS", "http://localhost:3000")
        self.device = os.getenv("DEVICE", "cpu")
        self.data_dir = Path(os.getenv("DATA_DIR", str(_REPO_ROOT / "data"))).resolve()
        self.max_image_pixels = int(os.getenv("MAX_IMAGE_PIXELS", str(50_000_000)))
        self.hvg_count = int(os.getenv("HVG_COUNT", "2000"))
        self.pca_components = int(os.getenv("PCA_COMPONENTS", "30"))
        self.umap_neighbors = int(os.getenv("UMAP_NEIGHBORS", "15"))
        self.umap_min_dist = float(os.getenv("UMAP_MIN_DIST", "0.1"))
        self.n_clusters = int(os.getenv("N_CLUSTERS", "8"))
        self.bootstrap_iterations = int(os.getenv("BOOTSTRAP_ITERATIONS", "12"))
        self.bootstrap_fraction = float(os.getenv("BOOTSTRAP_FRACTION", "0.8"))
        self.random_state = int(os.getenv("RANDOM_STATE", "0"))
        # 10x Genomics Visium: Human Breast Cancer, Block A Section 1 (CC-BY 4.0)
        self.visium_sample_id = os.getenv(
            "VISIUM_SAMPLE_ID",
            "V1_Breast_Cancer_Block_A_Section_1",
        )
        self.visium_matrix_url = os.getenv(
            "VISIUM_MATRIX_URL",
            "https://cf.10xgenomics.com/samples/spatial-exp/1.1.0/"
            "V1_Breast_Cancer_Block_A_Section_1/"
            "V1_Breast_Cancer_Block_A_Section_1_filtered_feature_bc_matrix.h5",
        )
        self.visium_spatial_url = os.getenv(
            "VISIUM_SPATIAL_URL",
            "https://cf.10xgenomics.com/samples/spatial-exp/1.1.0/"
            "V1_Breast_Cancer_Block_A_Section_1/"
            "V1_Breast_Cancer_Block_A_Section_1_spatial.tar.gz",
        )


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
