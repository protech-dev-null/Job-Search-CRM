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

## Тестовые данные

Заполнить локальную SQLite-базу демонстрационными вакансиями:

```powershell
uv run python -m app.db.seed
```

Повторный запуск не создаёт дубликаты вакансий.

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

GET    /api/vacancies
POST   /api/vacancies
GET    /api/vacancies/{vacancy_id}
PATCH  /api/vacancies/{vacancy_id}
DELETE /api/vacancies/{vacancy_id}

GET    /api/stats
```

### Фильтры списка вакансий

`GET /api/vacancies` поддерживает параметры:

```text
search
status
priority
work_format
source
skill
```

Пример комбинированного фильтра:

```text
GET /api/vacancies?status=applied&priority=high&skill=react
```

## Текущий этап

Этап 3: Stats API.

Сделано:

- FastAPI app
- настройки приложения
- CORS для frontend
- `/health` endpoint
- SQLAlchemy/SQLite foundation
- модель `Vacancy`
- Pydantic-схемы для Vacancy API
- CRUD endpoints для вакансий
- статистика по статусам и приоритетам
- рейтинг популярных навыков
- Ruff
- Pytest
- GitHub Actions workflow для backend

Следующий этап:

- подготовка API-контракта для React dashboard
- пагинация списка вакансий
