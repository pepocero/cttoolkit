# Estructura de datos

## Contenedor raíz (`AppData`)

```json
{
  "version": 1,
  "panels": []
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `version` | `number` | Versión del esquema (actual: `1`) |
| `panels` | `Panel[]` | Lista de paneles de trabajo |

## Panel

```json
{
  "id": "soc-ordenadores",
  "name": "Ordenadores del SOC",
  "createdAt": "2026-09-09T00:00:00.000Z",
  "updatedAt": "2026-09-09T00:00:00.000Z",
  "actions": []
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador estable (útil al combinar backups) |
| `name` | `string` | Nombre visible |
| `createdAt` | `string` (ISO 8601) | Fecha de creación |
| `updatedAt` | `string` (ISO 8601) | Última modificación |
| `actions` | `Action[]` | Acciones del panel |

## Acción

```json
{
  "id": "authenticator",
  "name": "Authenticator",
  "type": "url",
  "value": "https://aka.ms/mfasetup",
  "description": "Configuración de Microsoft Authenticator.",
  "favorite": true,
  "createdAt": "2026-09-09T00:00:00.000Z",
  "updatedAt": "2026-09-09T00:00:00.000Z"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador estable |
| `name` | `string` | Nombre visible (también base del `.bat`) |
| `type` | `ActionType` | Ver tabla de tipos |
| `value` | `string` | URL, UNC o comando |
| `description` | `string?` | Notas opcionales |
| `favorite` | `boolean?` | Si aparece en favoritos |
| `createdAt` / `updatedAt` | ISO | Auditoría local |

## Tipos (`ActionType`)

| Valor JSON | Etiqueta UI |
|------------|-------------|
| `url` | URL / Página web |
| `network` | Ruta de red |
| `windows` | Comando Windows |
| `cmd` | Comando CMD |
| `powershell` | Comando PowerShell |
| `custom` | Personalizado |

## Validación (no bloqueante en la mayoría de casos)

- **URL**: se recomienda `http://` o `https://` (aviso si no cumple)
- **Ruta de red**: se recomienda formato UNC `\\servidor\recurso` (aviso)
- **Comandos / custom**: cualquier texto no vacío
- Valor vacío: no se permite guardar

## Exportación

El archivo `tech-toolkit-backup.json` incluye además:

```json
{
  "version": 1,
  "exportedAt": "2026-09-09T12:00:00.000Z",
  "panels": []
}
```

`exportedAt` es informativo; la importación exige `panels` válidos.

## Ejemplo completo

Ver `src/data/defaultData.json` (panel **Ordenadores del SOC** con Authenticator, Impresoras y Adaptadores de red).
