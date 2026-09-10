# Autenticación JWT y Cloudflare D1

CT Toolkit usa **Cloudflare Pages** (frontend) + **Worker API** (`ct-toolkit-api`) + **D1** (SQLite), con autenticación **JWT HS256**.

## Modelo

- Tabla `users`: id, email, password_hash, password_salt, fechas
- Tabla `user_data`: paneles JSON por `user_id` (multitenant)
- Login/registro emiten un **JWT** (`alg: HS256`) en cookie HttpOnly `ct_toolkit_jwt` y en el cuerpo (`token`)
- El frontend en Pages guarda el `token` y lo envía como `Authorization: Bearer …` (necesario con orígenes distintos Pages/Worker)
- Las rutas protegidas validan el JWT (cookie o Bearer)
- CORS: `CORS_ORIGINS` + previews `*.ct-toolkit.pages.dev`

## Usuario semilla

Al arrancar la API se crea/actualiza (si no existe):

- Email: `pepocero@gmail.com` (`SEED_USER_EMAIL`)
- Contraseña: `SEED_USER_PASSWORD`
- Paneles iniciales: panel de muestra **Red oficina (ejemplo)** (`worker/src/seedData.json`)
- Todo usuario nuevo al registrarse recibe el mismo panel de muestra (5 acciones)

## Desarrollo local

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:api
npm run dev
```

## Despliegue

```bash
npx wrangler d1 create ct-toolkit
# Copia el database_id real en wrangler.jsonc

npx wrangler secret put AUTH_SECRET
npx wrangler secret put SEED_USER_PASSWORD
npm run db:migrate:remote
npm run deploy:api
# Ajusta .env.production → VITE_API_URL = URL del Worker
npm run deploy:pages
# Añade https://ct-toolkit.pages.dev (u origen custom) a CORS_ORIGINS y redeploy API
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crear cuenta + JWT |
| POST | `/api/auth/login` | Login + JWT |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario del JWT |
| GET | `/api/data` | Paneles del usuario |
| PUT | `/api/data` | Guardar paneles |

## Seguridad

- Contraseñas con PBKDF2-SHA256 + salt
- JWT firmado con `AUTH_SECRET`
- Un usuario solo lee/escribe su fila en D1
