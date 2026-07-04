# База данных и миграции

## SQLite

По умолчанию backend использует локальный файл:

```dotenv
DATABASE_URL="sqlite:///./job_search_crm.db"
```

Применить миграции:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\backend
uv run alembic upgrade head
```

Посмотреть текущую ревизию и проверить модели:

```powershell
uv run alembic current
uv run alembic check
```

## PostgreSQL

Запустить PostgreSQL из корня репозитория:

```powershell
docker compose up -d postgres
```

Создать конфигурацию backend:

```powershell
cd backend
Copy-Item .env.postgres.example .env
```

Создать схему и тестовые данные:

```powershell
uv sync
uv run alembic upgrade head
uv run python -m app.db.seed
```

Запустить API:

```powershell
uv run python run.py
```

Строка подключения для локального контейнера:

```dotenv
DATABASE_URL="postgresql+psycopg://job_search_crm:job_search_crm@localhost:5432/job_search_crm"
```

Остановить PostgreSQL:

```powershell
docker compose stop postgres
```

Чтобы вернуться к SQLite, восстановите `backend/.env` из `.env.example`.

## Создание миграции

После изменения SQLAlchemy-моделей:

```powershell
cd backend
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run alembic check
```

Перед коммитом обязательно просмотрите созданную миграцию вручную.
