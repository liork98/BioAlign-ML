from __future__ import annotations

import logging
import tarfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import h5py
import numpy as np
from PIL import Image
from scipy import sparse

from ..config import settings
from ..schemas import ImageManifest, TranscriptomicManifest, assert_expression_matrix
from .hashing import sha256_file

logger = logging.getLogger(__name__)

Image.MAX_IMAGE_PIXELS = settings.max_image_pixels


@dataclass
class VisiumBundle:
    sample_id: str
    dataset_name: str
    counts: sparse.csr_matrix
    barcodes: np.ndarray
    gene_names: np.ndarray
    positions: np.ndarray
    in_tissue: np.ndarray
    image: np.ndarray
    scalefactors: dict
    matrix_hash: str
    image_hash: str
    input_hash: str
    matrix_path: Path
    image_path: Path


def _download(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    tmp = dest.with_suffix(dest.suffix + ".partial")
    logger.info("Downloading %s -> %s", url, dest)
    request = urllib.request.Request(url, headers={"User-Agent": "BioAlign-ML/2.4"})
    with urllib.request.urlopen(request, timeout=120) as response, tmp.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    tmp.replace(dest)
    return dest


def _read_10x_h5(path: Path) -> tuple[sparse.csr_matrix, np.ndarray, np.ndarray]:
    with h5py.File(path, "r") as handle:
        group = handle["matrix"]
        data = group["data"][:]
        indices = group["indices"][:]
        indptr = group["indptr"][:]
        shape = tuple(int(x) for x in group["shape"][:])
        barcodes = np.array(
            [b.decode("utf-8") if isinstance(b, bytes) else str(b) for b in group["barcodes"][:]]
        )
        names = group["features"]["name"][:]
        gene_names = np.array(
            [g.decode("utf-8") if isinstance(g, bytes) else str(g) for g in names]
        )
    matrix = sparse.csc_matrix((data, indices, indptr), shape=shape)
    return matrix.T.tocsr(), barcodes, gene_names


def _load_scalefactors(spatial_dir: Path) -> dict:
    import json

    path = spatial_dir / "scalefactors_json.json"
    with path.open() as handle:
        return json.load(handle)


def _load_positions(spatial_dir: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    import csv

    candidates = [
        spatial_dir / "tissue_positions_list.csv",
        spatial_dir / "tissue_positions.csv",
    ]
    path = next((p for p in candidates if p.exists()), None)
    if path is None:
        raise FileNotFoundError("Visium tissue position file not found")

    barcodes: list[str] = []
    in_tissue: list[int] = []
    rows: list[int] = []
    cols: list[int] = []
    with path.open(newline="") as handle:
        reader = csv.reader(handle)
        first = next(reader)
        has_header = first and first[0].lower().startswith("barcode")
        if not has_header:
            barcodes.append(first[0])
            in_tissue.append(int(first[1]))
            rows.append(int(first[4]))
            cols.append(int(first[5]))
        for row in reader:
            if not row:
                continue
            barcodes.append(row[0])
            in_tissue.append(int(row[1]))
            rows.append(int(row[4]))
            cols.append(int(row[5]))
    return np.array(barcodes), np.array(in_tissue, dtype=bool), np.column_stack([rows, cols])


def _find_image(spatial_dir: Path) -> Path:
    for name in ("tissue_hires_image.png", "tissue_lowres_image.png"):
        path = spatial_dir / name
        if path.exists():
            return path
    raise FileNotFoundError("Visium tissue image not found")


def ensure_visium_bundle() -> VisiumBundle:
    root = settings.data_dir / "raw" / settings.visium_sample_id
    matrix_path = root / "filtered_feature_bc_matrix.h5"
    spatial_archive = root / "spatial.tar.gz"
    spatial_dir = root / "spatial"

    _download(settings.visium_matrix_url, matrix_path)
    _download(settings.visium_spatial_url, spatial_archive)
    if not spatial_dir.exists():
        with tarfile.open(spatial_archive, "r:gz") as tar:
            tar.extractall(root)
        # 10x archives often unpack into a nested "spatial/" folder
        if not spatial_dir.exists():
            nested = next(root.glob("**/scalefactors_json.json"), None)
            if nested is None:
                raise FileNotFoundError("Could not locate extracted Visium spatial folder")
            spatial_dir = nested.parent

    counts, barcodes, gene_names = _read_10x_h5(matrix_path)
    pos_barcodes, in_tissue, xy = _load_positions(spatial_dir)
    pos_index = {b: i for i, b in enumerate(pos_barcodes)}
    aligned_xy = np.zeros((len(barcodes), 2), dtype=np.float32)
    aligned_in = np.zeros(len(barcodes), dtype=bool)
    for i, barcode in enumerate(barcodes):
        idx = pos_index.get(barcode)
        if idx is None:
            continue
        aligned_xy[i] = xy[idx]
        aligned_in[i] = bool(in_tissue[idx])

    keep = aligned_in
    if keep.sum() < 10:
        keep = np.ones(len(barcodes), dtype=bool)

    image_path = _find_image(spatial_dir)
    image = np.asarray(Image.open(image_path).convert("RGB"))
    scalefactors = _load_scalefactors(spatial_dir)

    dense_check = counts[keep][: min(32, int(keep.sum()))].toarray()
    assert_expression_matrix(dense_check)

    TranscriptomicManifest(
        sample_id=settings.visium_sample_id,
        n_spots=int(keep.sum()),
        n_genes=int(counts.shape[1]),
        matrix_sha256=sha256_file(matrix_path),
        barcode_count=int(keep.sum()),
    )
    ImageManifest(
        sample_id=settings.visium_sample_id,
        width=int(image.shape[1]),
        height=int(image.shape[0]),
        channels=int(image.shape[2]),
        pixel_count=int(image.shape[0] * image.shape[1]),
        sha256=sha256_file(image_path),
    )

    matrix_hash = sha256_file(matrix_path)
    image_hash = sha256_file(image_path)
    from .hashing import combined_hash

    return VisiumBundle(
        sample_id=settings.visium_sample_id,
        dataset_name="10x Genomics Visium Human Breast Cancer (Block A Section 1)",
        counts=counts[keep],
        barcodes=barcodes[keep],
        gene_names=gene_names,
        positions=aligned_xy[keep],
        in_tissue=aligned_in[keep],
        image=image,
        scalefactors=scalefactors,
        matrix_hash=matrix_hash,
        image_hash=image_hash,
        input_hash=combined_hash(matrix_hash, image_hash, settings.visium_sample_id),
        matrix_path=matrix_path,
        image_path=image_path,
    )
