# BESS Planner Backend

FastAPI backend scaffold following the modular monolith structure in
`../bess-planner-backend-structure.md`.

## Run locally

```bash
python -m pip install -e .
uvicorn app.main:app --reload
```

The production Sizing Lab flow uses transient multipart uploads. Load/PV content is
read into request memory and passed directly to Oracle LP-PF; the application does not
write it into persistent storage. MongoDB stores the project configuration and analysis
result, not the uploaded file content or original file name.

```text
POST /api/v1/analyses/sizing-lab/transient
multipart: project_id, load_file, optional pv_file
```

Legacy `/files` and `/datasets` endpoints remain available for older records, but the
current BESS Planner wizard does not call them.

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
POST /api/v1/analyses/sizing-lab/transient
POST /api/v1/analyses/bess-planner
GET  /api/v1/analyses
GET  /api/v1/analyses/{analysis_run_id}
```

The transient Sizing Lab endpoint runs Oracle LP-PF, Pareto and SLSM, then stores the
analysis result without persisting the source Load/PV files.

## Lead pipeline

Public lead capture:

```text
POST /api/v1/leads
POST /api/v1/leads/quick-sizing
```

Admin-only pipeline management:

```text
GET   /api/v1/admin/leads
PATCH /api/v1/admin/leads/{lead_id}
```

Leads are upserted by normalized email. Contact submissions, Quick Sizing report
requests and account registrations become interactions on the same lead. Quick Sizing
stores a compact input/result snapshot. `training_consent` is tracked separately from
privacy and marketing consent; records without training consent must not be included in
model-training datasets.
