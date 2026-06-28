# Job Search CRM Frontend

React-интерфейс для просмотра статистики и списка вакансий.

Полная инструкция совместного запуска находится в
[`docs/local-development.md`](../docs/local-development.md).

## Стек

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Yarn Classic

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
yarn build
```

## Дополнительная настройка ESLint

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
