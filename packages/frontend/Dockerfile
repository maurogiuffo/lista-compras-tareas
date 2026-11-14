# syntax=docker/dockerfile:1
# Imagen de la web: build estático de Vite servido por nginx, que además
# redirige /api al contenedor de la API. Construir desde la raíz del repo:
#   docker build -f packages/frontend/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace @lista-compras/frontend --include-workspace-root
COPY tsconfig.base.json ./
COPY packages/frontend packages/frontend
RUN npm run build --workspace @lista-compras/frontend

FROM nginx:1.27-alpine AS runtime
COPY packages/frontend/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
# Dirección de la API dentro de la red de docker compose.
ENV API_UPSTREAM=http://api:3000
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
