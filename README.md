# Lista de compras y tareas

Web personal para manejar una lista de compras y tareas: agregar, editar y borrar ítems,
marcarlos como comprados (bajan al final) o como faltantes (suben al principio), reordenar
con arrastrar y soltar, filtrar por categoría, y asignar urgencia y fecha.

## Estructura

Monorepo con npm workspaces y TypeScript de punta a punta.

```
packages/
  backend/            API (Node.js)
    src/
      domain/         Entidades y reglas de negocio puras. No depende de nada externo.
        item/         Item, Category, Urgency, ItemStatus, DueDate, ItemOrder, ItemRepository (puerto)
        shared/       Errores de dominio
      application/    Casos de uso (uno por clase) y puertos (Clock, IdGenerator)
      infrastructure/ Adaptadores concretos
        persistence/  Repositorio SQLite (node:sqlite, sin dependencias nativas) y en memoria
        http/         Servidor Fastify, rutas y manejo de errores
      container.ts    Composition root: conecta repositorio, reloj, ids y casos de uso
      config.ts       Configuración por variables de entorno
      main.ts         Punto de entrada
    test/             Tests unitarios con Vitest
  frontend/           Web (React + Vite), pensada primero para el celular
    src/
      domain/         Tipos del contrato de la API y helpers puros (orden, vencimientos)
      api/            Puerto ItemsApi, implementación HTTP y su provider (inyección por contexto)
      hooks/          useItems: estado de la lista y acciones
      components/     Presentación: formulario, lista con arrastrar y soltar, filtro
    test/             Tests con Vitest + Testing Library contra un doble de la API
```

Las dependencias apuntan siempre hacia adentro: `infrastructure → application → domain`.
Los casos de uso reciben sus dependencias por constructor (inyección de dependencias), lo
que permite testearlos con implementaciones en memoria y cambiar SQLite por otra base sin
tocar el dominio.

## Reglas de negocio

| Acción                | Efecto                                                    |
| --------------------- | --------------------------------------------------------- |
| Crear ítem            | Queda como `pending` (falta) y entra al principio         |
| Marcar comprado/hecho | Pasa a `done` y baja a la última posición                 |
| Marcar que falta      | Vuelve a `pending` y sube al principio                    |
| Arrastrar y soltar    | Se ubica antes o después de otro ítem (funciona filtrado) |

Categorías: `insumos` y `tarea`. Los insumos pueden tener subcategoría opcional: `almacen`
(almacén y lácteos), `verduleria`, `carniceria`, `limpieza`, `perfumeria` o `mascotas` (las
tareas no llevan). Para sumar subcategorías, agregarlas a
`SUBCATEGORIES` en el dominio del backend y del frontend. Urgencia: `baja`, `media`
(por defecto), `alta`. Fecha opcional en formato `YYYY-MM-DD`.

## API

Base: `/api`. Errores con formato `{ "error": "CODIGO", "message": "..." }` (400 validación, 404 inexistente).

| Método | Ruta                            | Descripción                                                         |
| ------ | ------------------------------- | ------------------------------------------------------------------- |
| GET    | `/health`                       | Estado del servicio                                                 |
| GET    | `/items?category=&subcategory=` | Lista en orden; filtros opcionales                                  |
| POST   | `/items`                        | Crea `{ name, category, subcategory?, urgency?, dueDate?, notes? }` |
| PATCH  | `/items/:id`                    | Edita cualquiera de esos campos (`null` limpia fecha o notas)       |
| DELETE | `/items/:id`                    | Borra                                                               |
| POST   | `/items/:id/done`               | Marca comprado/hecho y lo baja al final                             |
| POST   | `/items/:id/pending`            | Marca que falta y lo sube al principio                              |
| POST   | `/items/:id/reorder`            | `{ beforeId }` o `{ afterId }`                                      |

## Configuración

| Variable        | Por defecto                   | Descripción                           |
| --------------- | ----------------------------- | ------------------------------------- |
| `PORT`          | `3000`                        | Puerto de la API                      |
| `HOST`          | `0.0.0.0`                     | Interfaz donde escucha                |
| `DATABASE_PATH` | `./data/lista-compras.sqlite` | Archivo SQLite (se crea si no existe) |
| `CORS_ORIGIN`   | (vacío)                       | Origen permitido para el front en dev |
| `LOG_LEVEL`     | `info`                        | Nivel de logs                         |

## Con Docker

```bash
docker compose up -d --build   # web en http://localhost:8080
```

Detalles, instalación en Ubuntu Server y backups en [DEPLOY.md](DEPLOY.md).

## Carga inicial de datos

`scripts/data/compras.json` tiene la lista de compras de base. Con la API corriendo:

```bash
npm run seed                                       # contra la API local (puerto 3000)
API_URL=http://localhost:8080/api npm run seed     # contra Docker
```

Es idempotente: si un ítem con el mismo nombre ya existe, lo saltea.

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev -w @lista-compras/backend    # API en http://localhost:3000 con recarga automática
npm run dev -w @lista-compras/frontend   # Web en http://localhost:5173 (redirige /api a la API)
npm test            # tests de todos los paquetes
npm run typecheck
npm run lint
npm run format
```

## Hoja de ruta

1. ✅ Base del proyecto, dominio y casos de uso con tests
2. ✅ API REST (Fastify) y persistencia en SQLite
3. ✅ Frontend en React
4. ✅ Docker y despliegue en Ubuntu Server (ver [DEPLOY.md](DEPLOY.md))
5. Más adelante: login con Google
