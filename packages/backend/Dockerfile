# syntax=docker/dockerfile:1
# Imagen de la API. Construir desde la raíz del repo:
#   docker build -f packages/backend/Dockerfile .

ARG NODE_VERSION=22-alpine

# ---- build: compila TypeScript con todas las dependencias ----
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
# La raíz aporta TypeScript y la config compartida.
RUN npm ci --workspace @lista-compras/backend --include-workspace-root
COPY tsconfig.base.json ./
COPY packages/backend packages/backend
RUN npm run build --workspace @lista-compras/backend

# ---- runtime: solo dependencias de producción y el código compilado ----
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/lista-compras.sqlite
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --omit=dev --workspace @lista-compras/backend --include-workspace-root=false \
    && npm cache clean --force
COPY --from=build /app/packages/backend/dist packages/backend/dist

RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

WORKDIR /app/packages/backend
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/main.js"]
