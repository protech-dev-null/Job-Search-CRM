# Job Search CRM

Fullstack-приложение для системного поиска работы.

## Стек

- Backend: Python, FastAPI, SQLAlchemy, uv
- Frontend: React, TypeScript, Tailwind CSS, Vite, yarn
- Database for MVP: SQLite

## Структура

```text
job-search-crm-mockup/
  backend/
  index.html
```

Сейчас `index.html` хранит первый статический макет интерфейса. Backend развивается поэтапно по стратегии проекта.

## Макет

Открой файл:

```text
C:\WorkSpace\petProjects\job-search-crm-mockup\index.html
```

В макете уже есть:

- дашборд поиска работы;
- канбан по статусам вакансий;
- таблица вакансий с фильтрами;
- карточка выбранной вакансии;
- блок аналитики по навыкам.

## Backend

```powershell
cd backend
uv sync
uv run fastapi dev app/main.py
```

После запуска:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
