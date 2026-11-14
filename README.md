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
  frontend/           (paso 3) React + Vite
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

Categorías: `verduleria`, `carnes`, `insumos`, `tarea`. Urgencia: `baja`, `media`
(por defecto), `alta`. Fecha opcional en formato `YYYY-MM-DD`.

## API

Base: `/api`. Errores con formato `{ "error": "CODIGO", "message": "..." }` (400 validación, 404 inexistente).

| Método | Ruta                 | Descripción                                                   |
| ------ | -------------------- | ------------------------------------------------------------- |
| GET    | `/health`            | Estado del servicio                                           |
| GET    | `/items?category=`   | Lista en orden; filtro opcional por categoría                 |
| POST   | `/items`             | Crea `{ name, category, urgency?, dueDate?, notes? }`         |
| PATCH  | `/items/:id`         | Edita cualquiera de esos campos (`null` limpia fecha o notas) |
| DELETE | `/items/:id`         | Borra                                                         |
| POST   | `/items/:id/done`    | Marca comprado/hecho y lo baja al final                       |
| POST   | `/items/:id/pending` | Marca que falta y lo sube al principio                        |
| POST   | `/items/:id/reorder` | `{ beforeId }` o `{ afterId }`                                |

## Configuración

| Variable        | Por defecto                   | Descripción                           |
| --------------- | ----------------------------- | ------------------------------------- |
| `PORT`          | `3000`                        | Puerto de la API                      |
| `HOST`          | `0.0.0.0`                     | Interfaz donde escucha                |
| `DATABASE_PATH` | `./data/lista-compras.sqlite` | Archivo SQLite (se crea si no existe) |
| `CORS_ORIGIN`   | (vacío)                       | Origen permitido para el front en dev |
| `LOG_LEVEL`     | `info`                        | Nivel de logs                         |

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev -w @lista-compras/backend   # API en http://localhost:3000 con recarga automática
npm test            # tests de todos los paquetes
npm run typecheck
npm run lint
npm run format
```

## Hoja de ruta

1. ✅ Base del proyecto, dominio y casos de uso con tests
2. ✅ API REST (Fastify) y persistencia en SQLite
3. Frontend en React
4. Docker y despliegue en Ubuntu Server
5. Más adelante: login con Google
