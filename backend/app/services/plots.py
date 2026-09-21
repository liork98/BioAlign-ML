from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns


def write_benchmark_plot(
    dest: Path,
    run_names: list[str],
    silhouettes: list[float],
    aris: list[float],
    stabilities: list[float],
) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid")
    fig, axes = plt.subplots(1, 3, figsize=(12, 3.6), dpi=140)
    metrics = [
        (axes[0], silhouettes, "Silhouette width", "#0ea5e9"),
        (axes[1], aris, "Adjusted Rand Index", "#22c55e"),
        (axes[2], stabilities, "Bootstrap stability", "#a855f7"),
    ]
    for ax, values, title, color in metrics:
        sns.barplot(x=run_names, y=values, ax=ax, color=color)
        ax.set_title(title)
        ax.set_ylim(0, 1.05)
        ax.tick_params(axis="x", rotation=25, labelsize=8)
        ax.set_ylabel("")
    fig.tight_layout()
    fig.savefig(dest, bbox_inches="tight")
    plt.close(fig)
    return dest


def write_umap_plot(
    dest: Path,
    coords: np.ndarray,
    labels: np.ndarray,
    title: str,
) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(6, 5), dpi=140)
    scatter = ax.scatter(coords[:, 0], coords[:, 1], c=labels, cmap="tab10", s=6, alpha=0.85)
    ax.set_xlabel("UMAP 1")
    ax.set_ylabel("UMAP 2")
    ax.set_title(title)
    fig.colorbar(scatter, ax=ax, label="cluster")
    fig.tight_layout()
    fig.savefig(dest, bbox_inches="tight")
    plt.close(fig)
    return dest
