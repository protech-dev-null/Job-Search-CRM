# Job Search CRM mockup

## Документация

- [Локальный запуск backend и frontend](docs/local-development.md)
- [Заполнение базы тестовыми данными](docs/seed-data.md)

## Структура

- `backend` — FastAPI, SQLAlchemy и SQLite
- `frontend` — React, TypeScript, Vite и Tailwind CSS
- `maket` — исходный статический макет интерфейса

Инструкции запуска находятся в `backend/README.md` и `frontend/README.md`.

Быстрый запуск из Git Bash или WSL:

```bash
bash start.sh
```

## Текущий этап

Этап 5: основа frontend.

Сделано:

- React + TypeScript приложение
- Tailwind CSS и Lucide icons
- типизированный API-клиент
- dashboard со статистикой и популярными навыками
- список вакансий с поиском, фильтром по статусу и пагинацией
- состояния загрузки и ошибки API

Следующий этап:

- форма создания вакансии
- frontend-тесты и CI
