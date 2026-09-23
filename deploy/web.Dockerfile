FROM caddy:2.11.4-builder-alpine AS xcaddy

FROM golang:1.27.1-alpine3.23 AS caddy-build
RUN apk add --no-cache git ca-certificates
COPY --from=xcaddy /usr/bin/xcaddy /usr/local/bin/xcaddy
ENV CGO_ENABLED=0 GOTOOLCHAIN=local
RUN xcaddy build v2.11.4 --output /usr/bin/caddy \
    --replace golang.org/x/crypto=golang.org/x/crypto@v0.55.0 \
    --replace golang.org/x/net=golang.org/x/net@v0.58.0 \
    --replace golang.org/x/text=golang.org/x/text@v0.41.0 \
    --replace google.golang.org/grpc=google.golang.org/grpc@v1.83.2
RUN caddy version && caddy list-modules

FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ ./
ENV VITE_API_URL=""
RUN yarn build

FROM caddy:2.11.4-alpine
COPY --from=caddy-build /usr/bin/caddy /usr/bin/caddy
RUN setcap cap_net_bind_service=+ep /usr/bin/caddy
COPY --from=build /app/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
