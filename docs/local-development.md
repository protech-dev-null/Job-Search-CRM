# Локальный запуск Job Search CRM

Backend и frontend запускаются одновременно в двух терминалах.

## Быстрый запуск через Git Bash или WSL

Из корня репозитория выполните:

```bash
bash start.sh
```

Скрипт при необходимости установит зависимости, а затем одновременно запустит
backend и frontend. Для остановки обоих процессов нажмите `Ctrl+C`.

Для Windows PowerShell используйте ручной запуск в двух терминалах, описанный
ниже.

## Требования

- Python 3.12 или новее
- uv
- Node.js 22 или новее
- Yarn 1.22

Все команды выполняются из репозитория:

```text
C:\WorkSpace\petProjects\job-search-crm-mockup
```

## Первый запуск

### 1. Подготовить backend

Откройте первый терминал:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\backend
uv sync
uv run python -m app.db.seed
```

Команда `seed` добавляет демонстрационные вакансии. Её можно запускать повторно:
существующие записи не дублируются.

### 2. Запустить backend

В первом терминале выполните:

```powershell
uv run python run.py
```

После запуска доступны:

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- проверка состояния: `http://127.0.0.1:8000/health`

Не закрывайте этот терминал.

### 3. Подготовить и запустить frontend

Откройте второй терминал:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\frontend
yarn install
yarn dev
```

Откройте приложение в браузере:

```text
http://127.0.0.1:5173
```

Vite автоматически перенаправляет запросы `/api` на backend по адресу
`http://127.0.0.1:8000`.

## Последующие запуски

После первой установки достаточно запустить два терминала.

Терминал 1:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\backend
uv run python run.py
```

Терминал 2:

```powershell
cd C:\WorkSpace\petProjects\job-search-crm-mockup\frontend
yarn dev
```

## Остановка

В каждом терминале нажмите `Ctrl+C`.

## Частые ошибки

### Frontend сообщает об ошибке API

Проверьте, что backend запущен и открывается адрес:

```text
http://127.0.0.1:8000/health
```

### Порт уже занят

Закройте ранее запущенный backend или frontend, затем повторите запуск.

### Команда запускается не из той папки

Команды `uv` выполняются из `backend`, а команды `yarn` — из `frontend`.
