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
      infrastructure/ Adaptadores concretos (persistencia, HTTP)
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

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm install
npm test            # tests de todos los paquetes
npm run typecheck
npm run lint
npm run format
```

## Hoja de ruta

1. ✅ Base del proyecto, dominio y casos de uso con tests
2. API REST (Fastify) y persistencia en SQLite
3. Frontend en React
4. Docker y despliegue en Ubuntu Server
5. Más adelante: login con Google
