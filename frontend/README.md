# Job Search CRM Frontend

React interface for viewing job search statistics and managing vacancies.

The complete local setup guide is available in
[`docs/local-development.md`](../docs/local-development.md).

## Features

- dashboard with job search statistics
- vacancy search, filtering, and pagination
- vacancy creation, details, editing, and deletion
- viewing, creating, editing, and deleting activities
- popular skill statistics

## Technology stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Yarn Classic
- Vitest and React Testing Library

Vite 6 is used for compatibility with the installed Node.js 22.11 runtime.

## Install

```powershell
yarn install
```

## Run

Start the backend at `http://127.0.0.1:8000`, then start the frontend:

```powershell
yarn dev
```

Vite proxies `/api` requests to the local backend. The frontend is available at
`http://127.0.0.1:5173`.

To use a different API address, create a `.env` file:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

## Checks

```powershell
yarn lint
yarn test
yarn build
```

Run tests in watch mode:

```powershell
yarn test:watch
```

GitHub Actions runs `lint`, `test`, and `build` for frontend changes pushed to
`main` and `feature/**` branches, and for pull requests targeting `main`.
