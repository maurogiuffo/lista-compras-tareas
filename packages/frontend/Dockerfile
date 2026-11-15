# syntax=docker/dockerfile:1
# Imagen de la web: build estático de Vite servido por nginx, que además
# redirige /api al contenedor de la API. Construir desde la raíz del repo:
#   docker build -f packages/frontend/Dockerfile .

# Ruta donde se publica la app, con barra al principio y al final: "/" o "/lista/".
ARG BASE_PATH=/

FROM node:22-alpine AS build
ARG BASE_PATH
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace @lista-compras/frontend --include-workspace-root
COPY tsconfig.base.json ./
COPY packages/frontend packages/frontend
RUN case "$BASE_PATH" in /*/|/) ;; *) echo "BASE_PATH debe empezar y terminar con /: $BASE_PATH" >&2; exit 1;; esac
RUN npm run build --workspace @lista-compras/frontend -- --base="$BASE_PATH"

FROM nginx:1.27-alpine AS runtime
ARG BASE_PATH
COPY packages/frontend/nginx.conf /etc/nginx/templates/default.conf.template
# Los archivos quedan bajo la misma ruta en la que se publican.
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html${BASE_PATH}
ENV BASE_PATH=${BASE_PATH} \
    API_UPSTREAM=http://api:3000 \
    AUTH_BASIC=off
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
