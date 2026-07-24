# BESS Planner Backend

FastAPI backend scaffold following the modular monolith structure in
`../bess-planner-backend-structure.md`.

## Run locally

```bash
python -m pip install -e .
uvicorn app.main:app --reload
```

Uploaded CSV/XLSX files are stored under `storage/uploads` by default. Configure
`STORAGE_DIRECTORY` and `MAX_UPLOAD_SIZE_MB` in the backend environment when needed.

The API health endpoint is available at:

```text
GET /health
GET /api/v1/status
```

## Auth endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Project endpoints

```text
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/{project_id}
PATCH  /api/v1/projects/{project_id}
DELETE /api/v1/projects/{project_id}
```

## Site endpoints

```text
POST   /api/v1/sites
GET    /api/v1/sites
GET    /api/v1/sites/{site_id}
PATCH  /api/v1/sites/{site_id}
DELETE /api/v1/sites/{site_id}
```

## Tariff endpoints

```text
POST   /api/v1/tariffs
GET    /api/v1/tariffs
GET    /api/v1/tariffs/{tariff_id}
PATCH  /api/v1/tariffs/{tariff_id}
DELETE /api/v1/tariffs/{tariff_id}
```

## BESS catalog endpoints

```text
POST   /api/v1/bess-catalog
GET    /api/v1/bess-catalog
GET    /api/v1/bess-catalog/{item_id}
PATCH  /api/v1/bess-catalog/{item_id}
DELETE /api/v1/bess-catalog/{item_id}
```

## File endpoints

```text
POST   /api/v1/files
GET    /api/v1/files
GET    /api/v1/files/{file_id}
GET    /api/v1/files/{file_id}/download
DELETE /api/v1/files/{file_id}
```

## Dataset endpoints

```text
POST   /api/v1/datasets
GET    /api/v1/datasets
GET    /api/v1/datasets/{dataset_id}
DELETE /api/v1/datasets/{dataset_id}
```

## Analysis endpoints

```text
POST /api/v1/analyses/quick-sizing
POST /api/v1/analyses/bess-planner
GET  /api/v1/analyses
GET  /api/v1/analyses/{analysis_run_id}
```

`POST /analyses/bess-planner` currently performs the data-readiness precheck and
stores an analysis run. Dispatch optimization and financial optimization remain the
next implementation stage.
