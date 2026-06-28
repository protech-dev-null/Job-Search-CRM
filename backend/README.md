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
page
page_size
```

`page` начинается с `1`. Значение `page_size` по умолчанию равно `20`,
максимальное значение — `100`.

Пример комбинированного фильтра:

```text
GET /api/vacancies?status=applied&priority=high&skill=react
```

Пример запроса второй страницы:

```text
GET /api/vacancies?page=2&page_size=10
```

Ответ списка вакансий:

```json
{
  "items": [],
  "total": 0,
  "page": 2,
  "page_size": 10,
  "pages": 0
}
```

## Текущий этап

Этап 4: API-контракт списка вакансий.

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
- фильтрация списка вакансий
- пагинация и метаданные списка вакансий
- Ruff
- Pytest
- GitHub Actions workflow для backend

Следующий этап:

- создание React-приложения
- подключение dashboard к backend API
