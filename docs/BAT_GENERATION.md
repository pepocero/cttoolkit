# Generación de archivos BAT

CT Toolkit genera archivos `.bat` **solo en el navegador** (`src/services/batGenerator.ts`). No hay backend ni ejecución remota.

## Flujo

1. El usuario pulsa **Descargar .BAT** en una acción.
2. Se construye el contenido según `action.type` y `action.value`.
3. Se crea un `Blob` y se dispara la descarga.
4. El nombre del archivo se deriva del nombre de la acción (`sanitizeFilename`), p. ej. `Authenticator.bat`, `configuracion-red.bat`.

## Plantillas por tipo

### URL (`url`)

```bat
@echo off
start "" "https://aka.ms/mfasetup"
```

### Ruta de red (`network`)

```bat
@echo off
start "" "\\ps-bllul297-01"
```

### Comando Windows (`windows`)

```bat
@echo off
start "" ncpa.cpl
```

### CMD (`cmd`)

```bat
@echo off
REM CT Toolkit — comando CMD
control printers
if errorlevel 1 pause
```

### PowerShell (`powershell`)

```bat
@echo off
REM CT Toolkit — invocación PowerShell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Service"
if errorlevel 1 pause
```

Comillas simples internas del comando se escapan duplicándolas para el literal PowerShell.

### Personalizado (`custom`)

El valor se escribe tal cual tras `@echo off`, con `pause` si hay errorlevel.

## Limitaciones del navegador

- Desde una web **HTTPS** no se pueden abrir de forma fiable rutas `file://` ni UNC.
- **No es posible** ejecutar `.bat`, CMD o PowerShell desde JavaScript por seguridad del navegador.
- El flujo soportado es: **copiar** el valor o **descargar** el `.bat` y ejecutarlo en Windows bajo responsabilidad del usuario.
- El botón **Abrir** solo aparece para URLs `http`/`https`.

## Advertencias de seguridad

- Un `.bat` puede realizar cambios en el sistema. Revisa el contenido antes de ejecutarlo.
- No descargues ni ejecutes backups/acciones de fuentes no confiables.
- CT Toolkit no firma ni valida la procedencia de los scripts generados.
- `ExecutionPolicy Bypass` en la plantilla PowerShell facilita la prueba en entornos controlados; ajústalo a la política de tu organización si es necesario.

## Nombres de archivo

`src/utils/filename.ts` elimina acentos, caracteres inválidos de Windows (`<>:"/\|?*`) y limita la longitud. Extensión forzada: `.bat` (o `.json` en exportaciones).
