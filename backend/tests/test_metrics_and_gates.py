from __future__ import annotations

import numpy as np
import pytest
from pydantic import ValidationError
from sklearn.cluster import KMeans
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import adjusted_rand_score, silhouette_score
from sklearn.preprocessing import StandardScaler

from app.schemas import ImageManifest, assert_expression_matrix
from app.services.clustering import bootstrap_stability, silhouette_safe
from app.services.hashing import combined_hash, sha256_bytes


def test_expression_gate_rejects_nan() -> None:
    matrix = np.ones((8, 4))
    matrix[0, 0] = np.nan
    with pytest.raises(ValueError, match="NaN"):
        assert_expression_matrix(matrix)


def test_expression_gate_rejects_negatives() -> None:
    with pytest.raises(ValueError, match="negative"):
        assert_expression_matrix(np.array([[1.0, -1.0], [0.0, 2.0]]))


def test_image_manifest_pixel_count_must_match() -> None:
    with pytest.raises(ValidationError):
        ImageManifest(
            sample_id="demo",
            width=10,
            height=10,
            channels=3,
            pixel_count=99,
            sha256="a" * 64,
        )


def test_metrics_on_wisconsin_diagnostic_breast_cancer() -> None:
    """WDBC is a published clinical morphology dataset (UCI / sklearn), not synthetic."""
    bundle = load_breast_cancer()
    X = StandardScaler().fit_transform(bundle.data)
    labels = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(X)
    sil = silhouette_score(X, labels)
    ari = adjusted_rand_score(bundle.target, labels)
    stab = bootstrap_stability(X, labels, n_clusters=2)
    assert -1.0 <= sil <= 1.0
    assert -1.0 <= ari <= 1.0
    assert 0.0 <= stab <= 1.0
    assert silhouette_safe(X, labels) == pytest.approx(sil)


def test_content_hash_is_deterministic() -> None:
    payload = b"visium-counts"
    assert sha256_bytes(payload) == sha256_bytes(payload)
    assert combined_hash("a", "b") != combined_hash("b", "a")
