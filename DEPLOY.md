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

## Detrás de nginx con HTTPS

Si el server ya tiene nginx con certificados (por ejemplo, Let's Encrypt), la app se publica
como un sitio más y el puerto 8080 queda accesible solo desde el propio server.

1. En `.env`:

   ```bash
   WEB_BIND=127.0.0.1
   WEB_PORT=8080
   ```

2. `docker compose up -d` para aplicar el cambio.

3. Un sitio en nginx (`/etc/nginx/sites-available/lista-compras`):

   ```nginx
   server {
       listen 443 ssl;
       http2 on;
       server_name compras.tudominio.com;

       ssl_certificate     /etc/letsencrypt/live/compras.tudominio.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/compras.tudominio.com/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto https;
       }
   }

   server {
       listen 80;
       server_name compras.tudominio.com;
       return 301 https://$host$request_uri;
   }
   ```

4. Activar y recargar:

   ```bash
   sudo ln -s /etc/nginx/sites-available/lista-compras /etc/nginx/sites-enabled/
   sudo certbot certonly --nginx -d compras.tudominio.com   # si todavía no hay certificado
   sudo nginx -t && sudo systemctl reload nginx
   ```

⚠ La app todavía no tiene login: publicada en internet, cualquiera con la URL puede verla y
editarla. Hasta sumar autenticación, conviene limitar el acceso (por ejemplo `allow`/`deny`
por IP o `auth_basic` en el `location`).

## Publicar en una subruta y con contraseña

Para servir la app en una ruta de un dominio existente (por ejemplo
`https://midominio.com/lista/`) y pedir usuario y contraseña:

1. Crear el archivo de usuarios (queda fuera de git):

   ```bash
   mkdir -p auth
   docker run --rm httpd:2.4-alpine htpasswd -nbB mauro 'una-clave-larga' > auth/htpasswd
   ```

2. En `.env`:

   ```bash
   BASE_PATH=/lista/
   AUTH_BASIC=Lista de compras
   ```

3. `docker compose up -d --build` (cambiar `BASE_PATH` requiere reconstruir).

4. En el proxy, reenviar la ruta `/lista` tal cual (sin quitar el prefijo) a
   `http://<ip-del-servidor>:<WEB_PORT>`. En Nginx Proxy Manager: editar el Proxy Host del
   dominio → **Custom locations** → **Add location**, con location `/lista`, esquema `http`,
   host `<ip-del-servidor>` y puerto `<WEB_PORT>`.

## Usuarios: cada uno con su propia lista

Con `AUTH_BASIC` activado, cada usuario de `auth/htpasswd` tiene su propia lista. Para
agregar uno (no hace falta reiniciar nada):

```bash
docker run --rm httpd:2.4-alpine htpasswd -nbB ana 'su-clave' >> auth/htpasswd
```

Para quitarlo, borrar su línea del archivo. Sin `AUTH_BASIC`, todos comparten la lista de
`DEFAULT_USER`. Al actualizar desde una versión sin usuarios, los ítems existentes pasan a
`DEFAULT_USER`: definirlo en `.env` (por ejemplo `DEFAULT_USER=mauro`) **antes** de levantar
la nueva versión.

Para cargar la lista inicial en la cuenta de un usuario:

```bash
docker run --rm --network lista-compras_default -v "$PWD/scripts:/scripts" \
  -e API_URL=http://api:3000/api -e SEED_USER=ana node:22-alpine node /scripts/seed.mjs
```

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

| Variable     | Por defecto | Dónde                         |
| ------------ | ----------- | ----------------------------- |
| `WEB_PORT`   | `8080`      | `.env`: puerto publicado      |
| `WEB_BIND`   | `0.0.0.0`   | `.env`: interfaz del puerto   |
| `BASE_PATH`  | `/`         | `.env`: ruta de publicación   |
| `AUTH_BASIC` | `off`       | `.env`: pedir usuario y clave |
| `LOG_LEVEL`  | `info`      | `.env`: nivel de logs del API |

El resto (`PORT`, `DATABASE_PATH`) ya está fijado dentro de la imagen de la API.
