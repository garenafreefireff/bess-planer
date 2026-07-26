from pathlib import Path

from app.dependencies.storage import LocalStorageClient


def test_local_storage_round_trip(tmp_path: Path) -> None:
    storage = LocalStorageClient(str(tmp_path))

    storage_path, absolute_path = storage.save(
        b"timestamp,value\n2026-01-01T00:00:00,10\n",
        user_id="user-1",
        project_id="project-1",
        extension="csv",
    )

    assert Path(absolute_path).exists()
    assert storage.exists(storage_path)
    assert b"".join(storage.iter_bytes(storage_path)) == (
        b"timestamp,value\n2026-01-01T00:00:00,10\n"
    )

    with storage.materialize(storage_path) as materialized:
        assert materialized.read_bytes().startswith(b"timestamp")

    storage.delete(storage_path)
    assert not storage.exists(storage_path)
