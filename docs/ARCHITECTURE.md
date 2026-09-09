# Arquitectura — CT Toolkit

## Visión general

CT Toolkit es una SPA (React + TypeScript + Vite) con API en **Cloudflare Worker**.

- Frontend: paneles, acciones, landing, login
- Backend: autenticación **JWT** + persistencia en **Cloudflare D1**
- Cada usuario solo accede a sus propios datos (multitenant)

```
┌──────────────────────────────────────────────┐
│                   Navegador                  │
│  React UI  →  JWT (cookie/Bearer)  →  /api   │
└───────────────────────┬──────────────────────┘
                        │
              Cloudflare Worker
                        │
                   Cloudflare D1
              (users + user_data)
```

## Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 4** + CSS de producto
- **Cloudflare Worker** + **D1**
- **JWT HS256** (Web Crypto)

## Estructura

```
src/                 # Frontend
worker/src/          # API Worker
migrations/          # SQL D1
docs/
public/landing/      # Imágenes de la landing
```

## Componentes principales

| Componente | Rol |
|------------|-----|
| `LandingPage` | Marketing / explicación del producto |
| `LoginView` | Login y registro |
| `HomeView` | Paneles, favoritos, búsqueda, backup |
| `PanelView` | Detalle de panel y acciones |
| `ActionCard` / `PanelCard` | Tarjetas de UI |
| `DropdownMenu` | Menú ⋮ con cierre al clic fuera |

## Gestión de estado

`AuthProvider` + `AppProvider`:

- Auth: sesión JWT vía cookie
- Datos: carga/guarda `/api/data` con debounce
- Migración opcional desde `localStorage` legado

## Persistencia (D1)

| Tabla | Contenido |
|-------|-----------|
| `users` | id, email, password_hash, password_salt |
| `user_data` | panels_json por user_id |

Ver `docs/AUTH_D1.md`.

## Offline / seguridad UI

Tras cargar la app, copiar / generar BAT / abrir URLs no requiere backend. La sincronización de paneles sí requiere API + JWT.

La app **nunca ejecuta comandos** en el navegador.
