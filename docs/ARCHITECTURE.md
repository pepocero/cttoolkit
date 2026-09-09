# Arquitectura — CT Toolkit

## Visión general

CT Toolkit es una **SPA estática** (React + TypeScript + Vite). No hay servidor de aplicación ni API: el navegador carga el bundle, gestiona el estado en memoria y persiste en `localStorage`. La generación de `.bat` y la exportación JSON se hacen con `Blob` + descarga en cliente.

```
┌─────────────────────────────────────────────┐
│                 Navegador                   │
│  React UI  →  AppContext  →  localStorage   │
│       ↓                                     │
│  batGenerator / backupService / clipboard   │
└─────────────────────────────────────────────┘
```

## Stack

- **React 19** + **TypeScript**
- **Vite 8** (build estático)
- **Tailwind CSS 4** (`@tailwindcss/vite`) + CSS de producto en `src/index.css`
- **lucide-react** para iconos
- Despliegue objetivo: **Cloudflare Pages** (`dist/`)

## Estructura de carpetas

```
src/
  components/     # UI reutilizable y vistas
  context/        # Estado global (AppContext)
  data/           # JSON de ejemplo (primera carga)
  services/       # storage, backup, bat
  types/          # Tipos TypeScript
  utils/          # id, filename, clipboard, validation, search
  App.tsx         # Shell + enrutado simple
  main.tsx
  index.css
docs/
public/           # favicon, _redirects (SPA)
```

## Componentes principales

| Componente | Rol |
|------------|-----|
| `HomeView` | Lista de paneles, favoritos, búsqueda, backup |
| `PanelView` | Detalle de un panel y sus acciones |
| `PanelCard` | Tarjeta de panel en el home |
| `ActionCard` | Tarjeta de acción (copiar, BAT, abrir, favorito) |
| `PanelForm` / `ActionForm` | Modales de alta/edición |
| `SearchBar` | Búsqueda global |
| `BackupManager` | Exportar / importar JSON |
| `Modal` / `ConfirmDialog` | Diálogos |

## Gestión de estado

`AppProvider` (`src/context/AppContext.tsx`) mantiene `AppData` y expone operaciones:

- Paneles: crear, renombrar, duplicar, eliminar
- Acciones: crear, actualizar, duplicar, eliminar, favorito
- Backup: exportar, importar (merge/replace)

Cada mutación actualiza el estado React; un `useEffect` persiste con `saveAppData`.

### Navegación

Enrutado en memoria (sin React Router) para maximizar simplicidad offline:

- `home` → `HomeView`
- `panel` + `panelId` → `PanelView`

## Persistencia

**Actual (v1.1):** Cloudflare R2 vía Worker API autenticada.

- Claves R2: `users/{userId}/data.json`, `users/{userId}/account.json`, `email-index/{email}`
- Sesión: cookie HttpOnly firmada
- Caché local opcional por usuario: `ct-toolkit-cache:{userId}`
- Backup JSON (export/import) sigue disponible en la UI

Ver `docs/AUTH_R2.md`.

## Capa de servicios

- **storageService** — lectura/escritura localStorage
- **backupService** — parseo, merge/replace, descarga JSON
- **batGenerator** — contenido `.bat` según `ActionType` + descarga

## Offline

Tras la primera carga del sitio (HTML/JS/CSS en caché del navegador o CDN), la app funciona sin red para CRUD local, copiar y generar BAT. No llama a APIs externas.
