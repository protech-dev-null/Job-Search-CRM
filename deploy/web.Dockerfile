FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
ENV VITE_API_URL=""
RUN yarn build

FROM caddy:2.10-alpine
COPY --from=build /app/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
