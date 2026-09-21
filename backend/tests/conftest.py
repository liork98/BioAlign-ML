from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture()
def sqlite_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "bioalign.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    from app.config import Settings
    from app import config

    config.settings = Settings()
    from app.db import init_db, reset_engine, get_engine, SessionLocal

    reset_engine()
    init_db()
    get_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        reset_engine()
