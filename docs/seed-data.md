# Заполнение базы тестовыми данными

Seed-скрипт заполняет локальную базу демонстрационными вакансиями для проверки
Vacancy API, Stats API и будущего React dashboard.

## Подготовка

Перейдите из корня репозитория в папку backend и установите зависимости:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\backend
uv sync
```

## Запуск

```powershell
uv run python -m app.db.seed
```

Команду нужно выполнять из папки `backend`, потому что Python-пакет `app`
расположен внутри неё.

Успешный запуск выводит количество добавленных вакансий:

```text
Seed complete: 12 vacancies added.
```

## Повторный запуск

Seed-скрипт идемпотентный. Он проверяет пару `company + position` и добавляет
только отсутствующие вакансии. При повторном запуске без изменений ожидается:

```text
Seed complete: 0 vacancies added.
```

## Расположение базы

Путь задаётся переменной `DATABASE_URL` в `backend/.env`.

Значение по умолчанию:

```text
sqlite:///./job_search_crm.db
```

При запуске из папки `backend` база создаётся здесь:

```text
backend/job_search_crm.db
```

Файл базы исключён через `.gitignore` и не должен попадать в коммиты.

## Проверка данных

Запустите backend:

```powershell
uv run fastapi dev app/main.py
```

После запуска данные доступны через endpoints:

```text
GET http://127.0.0.1:8000/api/vacancies
GET http://127.0.0.1:8000/api/stats
```

Интерактивная документация API:

```text
http://127.0.0.1:8000/docs
```

## Проверка seed-скрипта

```powershell
uv run python -B -m pytest tests/test_seed.py
```
