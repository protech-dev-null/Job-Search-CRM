# Job Search CRM Frontend

React-интерфейс для просмотра статистики и списка вакансий.

Полная инструкция совместного запуска находится в
[`docs/local-development.md`](../docs/local-development.md).

## Возможности

- dashboard со статистикой поиска работы
- поиск, фильтрация и пагинация вакансий
- создание, просмотр, редактирование и удаление вакансий
- просмотр, создание, редактирование и удаление Activity
- отображение популярных навыков

## Стек

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Yarn Classic
- Vitest и React Testing Library

Vite 6 выбран из-за совместимости с установленным Node.js 22.11.

## Установка

```powershell
yarn install
```

## Запуск

Сначала запустите backend на `http://127.0.0.1:8000`, затем frontend:

```powershell
yarn dev
```

Vite перенаправляет запросы `/api` на локальный backend.
Frontend открывается по адресу `http://127.0.0.1:5173`.

Для отдельного адреса API создайте `.env`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

## Проверки

```powershell
yarn lint
yarn test
yarn build
```

Для запуска тестов в режиме наблюдения:

```powershell
yarn test:watch
```

GitHub Actions запускает `lint`, `test` и `build` при изменениях frontend в
ветках `main` и `feature/**`, а также в Pull Request в `main`.
