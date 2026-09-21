from fastapi.testclient import TestClient

from app.config import settings
from app.db import reset_engine
from app.main import app


def test_health_and_empty_evaluation(tmp_path, monkeypatch):
    url = f"sqlite:///{tmp_path / 'api.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    settings.database_url = url
    reset_engine()
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        body = health.json()
        assert body["database"] == "connected"
        evaluation = client.get("/evaluation")
        assert evaluation.status_code == 200
        assert evaluation.json()["n_runs"] == 0
        explorer = client.get("/explorer")
        assert explorer.status_code == 200
        assert explorer.json()["points"] == []
        metrics = client.get("/metrics/summary")
        assert metrics.status_code == 200
        assert metrics.json()["total_samples"] == 0
