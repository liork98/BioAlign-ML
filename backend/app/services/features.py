from __future__ import annotations

import numpy as np
from scipy import sparse
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from ..config import settings
from .oom import safe_torch_projection
from .visium import VisiumBundle


def _highly_variable_indices(counts: sparse.spmatrix, n_top: int) -> np.ndarray:
    mean = np.asarray(counts.mean(axis=0)).ravel()
    mean_sq = np.asarray(counts.multiply(counts).mean(axis=0)).ravel()
    var = np.clip(mean_sq - mean**2, 0, None)
    dispersion = var / np.maximum(mean, 1e-8)
    n_top = min(n_top, counts.shape[1])
    return np.argpartition(dispersion, -n_top)[-n_top:]


def log_normalize_subset(counts: sparse.spmatrix, gene_idx: np.ndarray) -> np.ndarray:
    subset = counts[:, gene_idx]
    library = np.asarray(subset.sum(axis=1)).ravel()
    library[library == 0] = 1.0
    dense = subset.astype(np.float32).toarray()
    dense = dense / library[:, None] * 1e4
    return np.log1p(dense)


def image_spot_features(bundle: VisiumBundle, patch_radius: int = 8) -> np.ndarray:
    image = bundle.image
    scale = float(bundle.scalefactors.get("tissue_hires_scalef", 0.17))
    h, w = image.shape[:2]
    feats = np.zeros((len(bundle.positions), 8), dtype=np.float32)
    for i, (row, col) in enumerate(bundle.positions):
        y = int(row * scale)
        x = int(col * scale)
        y0, y1 = max(0, y - patch_radius), min(h, y + patch_radius)
        x0, x1 = max(0, x - patch_radius), min(w, x + patch_radius)
        patch = image[y0:y1, x0:x1]
        if patch.size == 0:
            continue
        rgb = patch.reshape(-1, 3).astype(np.float32)
        mean = rgb.mean(axis=0)
        std = rgb.std(axis=0)
        brightness = mean.mean()
        saturation = (rgb.max(axis=1) - rgb.min(axis=1)).mean()
        feats[i] = np.concatenate([mean, std, [brightness, saturation]])
    return feats


def multimodal_embedding(bundle: VisiumBundle) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    hvg = _highly_variable_indices(bundle.counts, settings.hvg_count)
    log_hvg = log_normalize_subset(bundle.counts, hvg)
    n_comp = min(settings.pca_components, log_hvg.shape[0] - 1, log_hvg.shape[1])
    rna_pca = PCA(n_components=n_comp, random_state=settings.random_state).fit_transform(log_hvg)
    img = image_spot_features(bundle)
    img_scaled = StandardScaler().fit_transform(img)
    combined = np.hstack([rna_pca, img_scaled]).astype(np.float32)
    combined = StandardScaler().fit_transform(combined)
    projected = safe_torch_projection(combined, out_dim=min(32, combined.shape[1]), device_name=settings.device)
    return projected.astype(np.float32), log_hvg, hvg
