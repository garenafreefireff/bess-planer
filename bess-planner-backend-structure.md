# BESS Planner Backend Project Structure

## 1. Architecture

Backend sử dụng kiến trúc:

```text
Modular Monolith
+ Feature-based modules
+ FastAPI
+ MongoDB
+ Constructor Injection
```

Luồng xử lý chuẩn:

```text
HTTP Request
    ↓
Router
    ↓
Service
    ↓
Repository
    ↓
MongoDB
```

Đối với chức năng tính toán:

```text
HTTP Request
    ↓
Analysis Router
    ↓
Analysis Service
    ├── Repositories
    └── Calculation Engine
```

Calculation Engine phải độc lập với FastAPI, MongoDB và HTTP.

---

## 2. Project Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── lifespan.py
│   │
│   ├── api/
│   │   ├── router.py
│   │   └── middleware/
│   │       ├── error_handler.py
│   │       ├── request_id.py
│   │       └── logging.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── logging.py
│   │   └── constants.py
│   │
│   ├── db/
│   │   ├── mongodb.py
│   │   └── indexes.py
│   │
│   ├── dependencies/
│   │   ├── database.py
│   │   ├── authentication.py
│   │   ├── storage.py
│   │   └── common.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── auth_session.py
│   │   ├── site.py
│   │   ├── project.py
│   │   ├── tariff.py
│   │   ├── bess_catalog.py
│   │   ├── file.py
│   │   ├── dataset.py
│   │   ├── analysis_run.py
│   │   ├── report.py
│   │   ├── lead.py
│   │   ├── audit_log.py
│   │   └── system_setting.py
│   │
│   ├── storage/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── object_storage.py
│   │
│   ├── integrations/
│   │   ├── email/
│   │   └── external_data/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── sites/
│   │   ├── projects/
│   │   ├── tariffs/
│   │   ├── bess_catalog/
│   │   ├── files/
│   │   ├── datasets/
│   │   ├── reports/
│   │   ├── leads/
│   │   ├── audit_logs/
│   │   ├── system_settings/
│   │   │
│   │   └── analyses/
│   │       ├── router.py
│   │       ├── schemas.py
│   │       ├── service.py
│   │       ├── repository.py
│   │       ├── dependencies.py
│   │       ├── enums.py
│   │       └── engine/
│   │           ├── common/
│   │           │   ├── models.py
│   │           │   ├── time_series.py
│   │           │   ├── units.py
│   │           │   └── exceptions.py
│   │           ├── quick_sizing/
│   │           │   ├── calculator.py
│   │           │   ├── models.py
│   │           │   └── validators.py
│   │           ├── bess_planner/
│   │           │   ├── sizing.py
│   │           │   ├── dispatch.py
│   │           │   ├── optimizer.py
│   │           │   └── constraints.py
│   │           ├── technical/
│   │           │   └── calculator.py
│   │           └── financial/
│   │               └── calculator.py
│   │
│   └── shared/
│       ├── schemas/
│       │   ├── pagination.py
│       │   ├── response.py
│       │   └── object_id.py
│       ├── enums.py
│       ├── types.py
│       └── utils.py
│
├── tests/
│   ├── unit/
│   │   ├── modules/
│   │   └── engines/
│   ├── integration/
│   │   ├── api/
│   │   └── repositories/
│   ├── fixtures/
│   └── conftest.py
│
├── scripts/
│   ├── create_indexes.py
│   ├── seed_admin.py
│   └── seed_catalog.py
│
├── Dockerfile
├── pyproject.toml
├── uv.lock
└── .env.example
```

Các thư mục `integrations/`, `storage/` và `scripts/` chỉ cần tạo khi có chức năng sử dụng thực tế.

---

## 3. Standard Module Structure

Một business module tiêu chuẩn:

```text
modules/projects/
├── router.py
├── schemas.py
├── service.py
├── repository.py
├── dependencies.py
└── enums.py
```

Không bắt buộc module nào cũng phải có đầy đủ tất cả file.

### Responsibilities

| File | Responsibility |
|---|---|
| `router.py` | Nhận HTTP request, inject dependency và trả response |
| `schemas.py` | Định nghĩa Pydantic request/response schema |
| `service.py` | Xử lý business logic và điều phối use case |
| `repository.py` | Thực hiện MongoDB query |
| `dependencies.py` | Khởi tạo repository, service và dependency riêng của module |
| `enums.py` | Chứa enum thuộc module |

---

## 4. Database Models

Tất cả MongoDB model được quản lý tập trung trong:

```text
app/models/
```

Mỗi collection sử dụng một file riêng:

```text
models/
├── user.py
├── site.py
├── project.py
├── dataset.py
├── analysis_run.py
└── report.py
```

Quy ước:

```text
app/models/                   MongoDB database models
modules/*/schemas.py          API request/response schemas
modules/*/repository.py       MongoDB queries
modules/*/service.py          Business logic
modules/*/router.py           HTTP endpoints
```

Không sử dụng một file `models.py` duy nhất chứa toàn bộ database model.

---

## 5. Dependency Injection

Sử dụng:

```text
FastAPI Depends
+ Constructor Injection
```

Không sử dụng DI container bên ngoài ở giai đoạn hiện tại.

### Dependency Graph

```text
ProjectService
└── ProjectRepository
    └── Database
```

```text
AnalysisService
├── AnalysisRepository
├── DatasetRepository
├── TariffRepository
└── BessPlannerEngine
```

---

## 6. Dependency Organization

### Application Dependencies

Dependency dùng chung toàn application đặt tại:

```text
app/dependencies/
```

Bao gồm:

- Database
- Authentication
- Current user
- Storage
- Pagination
- Request context
- Authorization

### Module Dependencies

Dependency riêng của module đặt tại:

```text
modules/<module>/dependencies.py
```

Ví dụ:

```text
modules/projects/dependencies.py
```

File này định nghĩa:

```text
get_project_repository()
get_project_service()
ProjectRepositoryDep
ProjectServiceDep
```

---

## 7. Dependency Lifetime

### Application Lifetime

Khởi tạo một lần trong `lifespan.py`:

- MongoDB client và connection pool
- Object Storage client
- Shared HTTP client
- Email client
- Engine hoặc model có chi phí khởi tạo lớn

Các resource được lưu trong:

```python
app.state
```

### Request Lifetime

Được resolve theo từng HTTP request:

- Current user
- Repository
- Service
- Request context

### Transient

Được tạo khi cần:

- Mapper
- Validator
- Calculator
- Stateless calculation engine

---

## 8. DI Rules

### Router

Router chỉ inject service và dependency liên quan đến HTTP:

```text
Router
├── Service
├── Current User
└── Request Context
```

Router không query MongoDB trực tiếp.

### Service

Service nhận dependency qua constructor:

```python
class ProjectService:
    def __init__(self, project_repository: ProjectRepository):
        self.project_repository = project_repository
```

Service không sử dụng `Depends`.

### Repository

Repository nhận database hoặc collection qua constructor:

```python
class ProjectRepository:
    def __init__(self, database):
        self.collection = database["projects"]
```

### Calculation Engine

Engine là Python class thuần và không phụ thuộc vào:

- FastAPI
- `Depends`
- MongoDB
- Repository
- HTTP request/response schema

Engine phải có thể sử dụng lại từ API, worker, CLI và unit test.

---

## 9. Mandatory Rules

- Router không chứa business logic lớn.
- Router không gọi repository trực tiếp.
- Service không tự khởi tạo repository.
- Service và engine không import `Depends`.
- Repository chỉ chịu trách nhiệm truy cập dữ liệu.
- Database model được đặt tập trung tại `app/models/`.
- API schema được đặt trong từng module.
- Calculation Engine không truy cập MongoDB trực tiếp.
- MongoDB client không được tạo lại cho mỗi request.
- Không sử dụng global service locator.
- Không tạo abstraction dùng chung nếu chưa có ít nhất hai use case thực tế.

---

## 10. Final Convention

```text
main.py
    FastAPI application entrypoint

lifespan.py
    Application resource initialization and cleanup

api/router.py
    Register module routers

core/
    Configuration, security, exception and logging

db/
    MongoDB connection and indexes

dependencies/
    Shared application dependencies

models/
    Centralized MongoDB models

modules/
    Feature-based business modules

storage/
    File storage implementations

integrations/
    External services and APIs

shared/
    Truly reusable schemas, types and utilities

modules/analyses/engine/
    Pure Python calculation logic
```

Kiến trúc chính thức:

```text
Centralized Database Models
+ Feature-based Business Modules
+ FastAPI Depends at Application Boundary
+ Constructor Injection in Services, Repositories and Engines
```
