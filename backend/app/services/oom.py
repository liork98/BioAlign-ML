from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def resolve_device(requested: str) -> str:
    requested = requested.lower()
    if requested == "cpu":
        return "cpu"
    try:
        import torch

        if requested == "cuda" and torch.cuda.is_available():
            return "cuda"
    except Exception:
        logger.info("PyTorch CUDA not available; using CPU")
    return "cpu"


def cuda_memory_pct(device: str) -> float:
    if device != "cuda":
        return 0.0
    try:
        import torch

        if not torch.cuda.is_available():
            return 0.0
        allocated = torch.cuda.memory_allocated()
        reserved = torch.cuda.max_memory_allocated() or torch.cuda.get_device_properties(0).total_memory
        total = torch.cuda.get_device_properties(0).total_memory
        if total <= 0:
            return 0.0
        return round(100.0 * allocated / total, 2)
    except Exception:
        return 0.0


def safe_torch_projection(features: np.ndarray, out_dim: int, device_name: str) -> np.ndarray:
    """Project features with a linear layer; on CUDA OOM, empty cache and retry on CPU."""
    try:
        import torch
        import torch.nn as nn
    except Exception:
        return features

    device = resolve_device(device_name)
    x = torch.from_numpy(np.asarray(features, dtype=np.float32))
    layer = nn.Linear(x.shape[1], out_dim)

    def _run(target: str) -> np.ndarray:
        tensor = x.to(target)
        proj = layer.to(target)
        with torch.no_grad():
            out = proj(tensor)
        return out.detach().cpu().numpy()

    try:
        return _run(device)
    except RuntimeError as exc:
        message = str(exc).lower()
        if "out of memory" in message or "cuda" in message:
            logger.warning("CUDA OOM during projection; falling back to CPU")
            try:
                import torch

                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except Exception:
                pass
            return _run("cpu")
        raise


def current_device_stats() -> dict[str, Any]:
    device = resolve_device("cuda")
    return {"device": device, "cuda_usage_pct": cuda_memory_pct(device)}
