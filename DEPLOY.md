# Despliegue con Docker

La app corre en dos contenedores orquestados con `docker compose`:

| Servicio | Imagen              | Qué hace                                                              |
| -------- | ------------------- | --------------------------------------------------------------------- |
| `api`    | `lista-compras-api` | API Node.js. Guarda la base SQLite en el volumen `lista-compras-data` |
| `web`    | `lista-compras-web` | nginx: sirve la web y redirige `/api` al servicio `api`               |

Solo se publica el puerto de `web` (por defecto `8080`). La API no queda expuesta afuera.

## Probar en tu PC (Windows con Docker Desktop)

```bash
docker compose up --build
```

Abrí <http://localhost:8080>. `Ctrl+C` para detener. Los datos quedan en el volumen y
sobreviven a reinicios.

## Instalar en Ubuntu Server

### 1. Instalar Docker (una sola vez)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER   # para usar docker sin sudo; cerrar sesión y volver a entrar
docker compose version          # verificar
```

### 2. Traer el código

Con GitHub:

```bash
git clone https://github.com/<tu-usuario>/lista-compras.git
cd lista-compras
```

Sin GitHub, desde tu PC (PowerShell o Git Bash):

```bash
scp -r lista-compras usuario@ip-del-servidor:~/   # excluí node_modules si existe
```

### 3. Configurar y levantar

```bash
cp .env.example .env    # opcional: cambiar WEB_PORT
docker compose up -d --build
docker compose ps       # ambos servicios deben figurar como "healthy"
```

Abrí `http://<ip-del-servidor>:8080` desde el celular (en la misma red).

Los contenedores tienen `restart: unless-stopped`, así que vuelven solos si se reinicia el
servidor.

## Operación

| Tarea       | Comando                                        |
| ----------- | ---------------------------------------------- |
| Ver logs    | `docker compose logs -f api`                   |
| Actualizar  | `git pull && docker compose up -d --build`     |
| Detener     | `docker compose down` (los datos se conservan) |
| Borrar todo | `docker compose down -v` (⚠ borra los datos)   |

### Backup de la base

La base es un archivo SQLite dentro del volumen. Para copiarlo de forma consistente, se
detiene la API un momento:

```bash
docker compose stop api
docker run --rm -v lista-compras_lista-compras-data:/data -v "$PWD":/backup alpine \
  cp /data/lista-compras.sqlite /backup/lista-compras-$(date +%F).sqlite
docker compose start api
```

Para restaurar, el mismo comando con el `cp` invertido.

## Variables de entorno

| Variable    | Por defecto | Dónde                         |
| ----------- | ----------- | ----------------------------- |
| `WEB_PORT`  | `8080`      | `.env`: puerto publicado      |
| `LOG_LEVEL` | `info`      | `.env`: nivel de logs del API |

El resto (`PORT`, `DATABASE_PATH`) ya está fijado dentro de la imagen de la API.
