# Job Search CRM Backend

Backend API для Job Search CRM.

## Стек

- Python
- FastAPI
- uv
- Pydantic

## Запуск

```powershell
uv sync
uv run fastapi dev app/main.py
```

## Endpoints

```text
GET /health
```

## Текущий этап

Этап 1: скелет backend-приложения.

Сделано:

- FastAPI app
- настройки приложения
- CORS для frontend
- `/health` endpoint

Следующий этап:

- SQLAlchemy
- SQLite
- модель `Vacancy`
- CRUD endpoints
