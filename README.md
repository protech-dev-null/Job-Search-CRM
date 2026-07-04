# Job Search CRM mockup

Job Search CRM — fullstack-приложение для ведения вакансий, истории контактов и
аналитики процесса поиска работы.

## Архитектура

```text
React + TypeScript
        |
        | HTTP /api
        v
FastAPI routes -> services -> SQLAlchemy -> SQLite / PostgreSQL
        |
        +-> статистика по статусам, приоритетам и навыкам
```

- frontend отвечает за dashboard, фильтрацию, формы вакансий и Activity;
- backend хранит данные, валидирует API-контракт и рассчитывает статистику;
- Alembic управляет схемой SQLite и PostgreSQL;
- GitHub Actions отдельно проверяет backend и frontend.

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

Этап 9: стабилизация MVP и подготовка портфолио.

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
- просмотр полной карточки и удаление вакансии во frontend
- просмотр и управление историей Activity во frontend
- компонентные тесты основных пользовательских сценариев
- frontend CI: ESLint, Vitest и production build
- PostgreSQL 18 smoke-test: миграции, seed и ключевые API endpoints

Следующий этап:

- подготовка скриншотов работающего приложения
- оформление итогового портфолио-описания и roadmap
