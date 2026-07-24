# BESS Planner Backend

FastAPI backend scaffold following the modular monolith structure in
`../bess-planner-backend-structure.md`.

## Run locally

```bash
uvicorn app.main:app --reload
```

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

## Analysis endpoints

```text
POST /api/v1/analyses/quick-sizing
GET  /api/v1/analyses
GET  /api/v1/analyses/{analysis_run_id}
```
