# Job Search CRM mockup

## Документация

- [Локальный запуск backend и frontend](docs/local-development.md)
- [База данных, Alembic и PostgreSQL](docs/database.md)
- [Заполнение базы тестовыми данными](docs/seed-data.md)

## Структура

- `backend` — FastAPI, SQLAlchemy, SQLite/PostgreSQL и Alembic
- `frontend` — React, TypeScript, Vite и Tailwind CSS
- `maket` — исходный статический макет интерфейса

Инструкции запуска находятся в `backend/README.md` и `frontend/README.md`.

Быстрый запуск из Git Bash или WSL:

```bash
bash start.sh
```

## Текущий этап

Этап 8: качество и автоматизация frontend.

Сделано:

- React + TypeScript приложение
- Tailwind CSS и Lucide icons
- типизированный API-клиент
- dashboard со статистикой и популярными навыками
- список вакансий с поиском, фильтром по статусу и пагинацией
- состояния загрузки и ошибки API
- миграции Alembic
- окружение PostgreSQL через Docker Compose
- история вакансии `Activity`
- нормализованные модели `Skill` и `vacancy_skills`
- создание и редактирование вакансии во frontend
- просмотр и управление историей Activity во frontend
- компонентные тесты основных пользовательских сценариев
- frontend CI: ESLint, Vitest и production build

Следующий этап:

- локальный smoke-тест PostgreSQL через Docker Compose
- улучшение README и подготовка скриншотов для портфолио
