# Autenticación y Cloudflare R2

CT Toolkit usa un **Cloudflare Worker** + **R2** para autenticación y almacenamiento multitenant.

## Modelo

- Cada usuario tiene cuenta (email + contraseña).
- Los paneles de cada usuario viven en R2 bajo `users/{userId}/data.json`.
- El índice de email está en `email-index/{email}`.
- Un usuario **nunca** puede leer ni escribir datos de otro (el `userId` sale solo de la sesión).

## Usuario semilla

Al arrancar la API se crea (si no existe):

- Email: `pepocero@gmail.com` (configurable con `SEED_USER_EMAIL`)
- Contraseña: secreto `SEED_USER_PASSWORD`
- Paneles iniciales: los del panel de ejemplo **Ordenadores del SOC** (`worker/src/seedData.json`)

Si en el navegador había datos previos en `localStorage` y entras con `pepocero@gmail.com`, la app intenta migrarlos una vez a R2.

## Desarrollo local

1. Copia `.dev.vars.example` → `.dev.vars` y define secretos.
2. Terminal A (API + R2 local):

```bash
npm run dev:api
```

3. Terminal B (frontend Vite, proxy `/api` → `8787`):

```bash
npm run dev
```

## Despliegue

```bash
npx wrangler r2 bucket create ct-toolkit-data
npx wrangler secret put AUTH_SECRET
npx wrangler secret put SEED_USER_PASSWORD
npm run deploy
```

`AUTH_SECRET` debe ser una cadena larga y aleatoria (≥ 32 caracteres).

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crear cuenta (paneles vacíos) |
| POST | `/api/auth/login` | Iniciar sesión (cookie HttpOnly) |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/data` | Paneles del usuario autenticado |
| PUT | `/api/data` | Guardar paneles del usuario autenticado |

## Seguridad

- Contraseñas con PBKDF2-SHA256 (120k iteraciones) + salt.
- Sesión firmada HMAC-SHA256 en cookie `HttpOnly`.
- La app no ejecuta comandos en el navegador (sigue siendo solo copiar / BAT / URLs).
