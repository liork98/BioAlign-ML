from __future__ import annotations

import numpy as np
from sklearn.cluster import AgglomerativeClustering, KMeans, MiniBatchKMeans, SpectralClustering
from sklearn.decomposition import PCA
from sklearn.mixture import GaussianMixture
from sklearn.metrics import adjusted_rand_score, silhouette_samples, silhouette_score

from ..config import settings


def two_d_embedding(features: np.ndarray) -> tuple[np.ndarray, str]:
    try:
        import umap

        coords = umap.UMAP(
            n_neighbors=min(settings.umap_neighbors, max(2, len(features) - 1)),
            min_dist=settings.umap_min_dist,
            random_state=settings.random_state,
        ).fit_transform(features)
        return coords.astype(np.float32), "umap"
    except Exception:
        coords = PCA(n_components=2, random_state=settings.random_state).fit_transform(features)
        return coords.astype(np.float32), "pca"


def cluster_algorithms(n_clusters: int, n_samples: int) -> list[tuple[str, str, object]]:
    k = min(n_clusters, max(2, n_samples // 10))
    models: list[tuple[str, str, object]] = [
        ("Baseline UMAP + KMeans", "kmeans", KMeans(n_clusters=k, n_init=10, random_state=settings.random_state)),
        (
            "Agglomerative (Ward)",
            "agglomerative",
            AgglomerativeClustering(n_clusters=k, linkage="ward"),
        ),
        (
            "Gaussian Mixture Model",
            "gmm",
            GaussianMixture(n_components=k, random_state=settings.random_state),
        ),
        (
            "MiniBatch KMeans",
            "minibatch_kmeans",
            MiniBatchKMeans(n_clusters=k, random_state=settings.random_state, n_init=10),
        ),
    ]
    if n_samples <= 2500:
        models.append(
            (
                "Spectral Clustering",
                "spectral",
                SpectralClustering(
                    n_clusters=k,
                    random_state=settings.random_state,
                    assign_labels="kmeans",
                    affinity="nearest_neighbors",
                    n_neighbors=min(15, n_samples - 1),
                ),
            )
        )
    return models


def fit_labels(model: object, features: np.ndarray) -> np.ndarray:
    if hasattr(model, "fit_predict"):
        return np.asarray(model.fit_predict(features))
    model.fit(features)
    return np.asarray(model.predict(features))


def silhouette_safe(features: np.ndarray, labels: np.ndarray) -> float:
    if len(set(labels)) < 2:
        return 0.0
    return float(silhouette_score(features, labels, metric="euclidean"))


def per_cluster_silhouette(features: np.ndarray, labels: np.ndarray) -> dict[int, float]:
    if len(set(labels)) < 2:
        return {int(c): 0.0 for c in set(labels)}
    samples = silhouette_samples(features, labels, metric="euclidean")
    return {int(c): float(samples[labels == c].mean()) for c in np.unique(labels)}


def bootstrap_stability(features: np.ndarray, labels: np.ndarray, n_clusters: int) -> float:
    rng = np.random.default_rng(settings.random_state)
    n = features.shape[0]
    take = max(2, int(n * settings.bootstrap_fraction))
    scores: list[float] = []
    k = len(set(labels))
    for _ in range(settings.bootstrap_iterations):
        idx = rng.choice(n, size=take, replace=False)
        subset = features[idx]
        model = KMeans(n_clusters=k, n_init=5, random_state=settings.random_state)
        boot_labels = model.fit_predict(subset)
        scores.append(float(adjusted_rand_score(labels[idx], boot_labels)))
    return float(np.mean(scores)) if scores else 0.0


def cluster_compactness(coords: np.ndarray, labels: np.ndarray) -> dict[int, float]:
    out: dict[int, float] = {}
    for c in np.unique(labels):
        pts = coords[labels == c]
        centroid = pts.mean(axis=0)
        dist = np.linalg.norm(pts - centroid, axis=1).mean()
        out[int(c)] = float(dist)
    return out


def top_marker_genes(
    expression: np.ndarray,
    gene_names: np.ndarray,
    labels: np.ndarray,
    cluster: int,
    n: int = 6,
) -> list[str]:
    mask = labels == cluster
    if mask.sum() == 0 or (~mask).sum() == 0:
        return []
    inside = expression[mask].mean(axis=0)
    outside = expression[~mask].mean(axis=0)
    score = inside - outside
    top = np.argsort(score)[-n:][::-1]
    return [str(gene_names[i]) for i in top]
