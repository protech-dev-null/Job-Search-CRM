# Job Search CRM Backend

Backend API for Job Search CRM.

## Technology stack

- Python
- FastAPI
- SQLAlchemy
- SQLite
- PostgreSQL
- Alembic
- uv
- Pydantic
- Ruff
- Pytest

## Run

```powershell
uv sync
uv run alembic upgrade head
uv run fastapi dev app/main.py
```

Alternative command for PyCharm:

```powershell
uv run python run.py
```

`run.py` automatically applies migrations before starting the server.

## Migrations

```powershell
uv run alembic current
uv run alembic upgrade head
uv run alembic check
```

Create a migration after changing the models:

```powershell
uv run alembic revision --autogenerate -m "describe change"
```

See `docs/database.md` for SQLite and PostgreSQL details.

## Demo data

Populate the local SQLite database with demo vacancies:

```powershell
uv run python -m app.db.seed
```

Running the command again does not create duplicate vacancies.

## Checks

The same commands run in CI:

```powershell
uv run ruff check .
uv run ruff format --check .
uv run python -B -m pytest
```

## Endpoints

```text
GET /health

GET    /api/vacancies
POST   /api/vacancies
GET    /api/vacancies/{vacancy_id}
PATCH  /api/vacancies/{vacancy_id}
DELETE /api/vacancies/{vacancy_id}

GET    /api/vacancies/{vacancy_id}/activities
POST   /api/vacancies/{vacancy_id}/activities
PATCH  /api/vacancies/{vacancy_id}/activities/{activity_id}
DELETE /api/vacancies/{vacancy_id}/activities/{activity_id}

GET    /api/skills
GET    /api/stats
```

### Vacancy list filters

`GET /api/vacancies` supports these parameters:

```text
search
status
priority
work_format
source
skill
page
page_size
```

`page` starts at `1`. The default `page_size` is `20`, and the maximum is
`100`.

Combined filter example:

```text
GET /api/vacancies?status=applied&priority=high&skill=react
```

Second-page request example:

```text
GET /api/vacancies?page=2&page_size=10
```

Vacancy list response:

```json
{
  "items": [],
  "total": 0,
  "page": 2,
  "page_size": 10,
  "pages": 0
}
```

## Current status

The backend MVP scope is complete.

Completed:

- FastAPI application
- application settings
- CORS configuration for the frontend
- `/health` endpoint
- SQLAlchemy and SQLite foundation
- `Vacancy` model
- Pydantic schemas for the Vacancy API
- CRUD endpoints for vacancies
- statistics by status and priority
- popular skill ranking
- vacancy filtering
- pagination and vacancy list metadata
- Alembic migrations
- PostgreSQL support through Psycopg 3
- `Activity` model and API
- normalized `Skill` model
- Ruff
- Pytest
- backend GitHub Actions workflow

Next project milestone:

- portfolio packaging and the final MVP roadmap
