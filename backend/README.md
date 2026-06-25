# Job Search CRM Backend

Backend API для Job Search CRM.

## Стек

- Python
- FastAPI
- SQLAlchemy
- SQLite
- uv
- Pydantic
- Ruff
- Pytest

## Запуск

```powershell
uv sync
uv run fastapi dev app/main.py
```

Альтернативный запуск для PyCharm:

```powershell
uv run python run.py
```

## Проверки

Эти же команды запускаются в CI:

```powershell
uv run ruff check .
uv run ruff format --check .
uv run python -B -m pytest
```

## Endpoints

```text
GET /health
```

## Текущий этап

Этап 2.1: Database Foundation.

Сделано:

- FastAPI app
- настройки приложения
- CORS для frontend
- `/health` endpoint
- SQLAlchemy/SQLite foundation
- модель `Vacancy`
- Ruff
- Pytest
- GitHub Actions workflow для backend

Следующий этап:

- CRUD endpoints
- Pydantic-схемы для Vacancy API
