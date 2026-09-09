# Mejoras futuras

La arquitectura actual (`AppData` en JSON + servicios desacoplados) permite evolucionar sin reescribir la UI.

## Sincronización entre dispositivos

**Implementado (v1.1):** Cloudflare Worker + R2 + autenticación por usuario.

Pendiente de mejorar:

- Resolución de conflictos avanzada (last-write-wins / merge por campo)
- Sincronización en tiempo real

## Backend en Cloudflare

- **Workers + R2:** implementado para auth y datos por usuario
- **D1 (opcional):** índice SQL de usuarios si se quiere consultar/administrar cuentas
- **KV:** caché de sesiones si se escala

## Otras opciones de sync

- **Supabase:** alternativa Auth + Postgres
- **GitHub Gist privado:** backup versionado

## Usuarios y multitenancy

- **Implementado:** cuentas por técnico y datos aislados por `userId` en R2
- Pendiente: paneles compartidos de solo lectura para un equipo (SOC)

## Paneles compartidos

- Enlaces de solo lectura firmados
- Plantillas de organización (impresoras, AD, red)

## PWA

- `manifest.webmanifest` + service worker
- Instalación en escritorio/móvil
- Caché de assets para uso offline real tras la primera visita

## Seguridad avanzada

- Cifrado de valores sensibles (AES-GCM con passphrase local)
- Campos marcados como “secreto” ocultos por defecto
- Auditoría de exportaciones
- 2FA / passkeys

## UX

- Atajos de teclado (copiar acción seleccionada)
- Etiquetas / carpetas dentro de un panel
- Historial de acciones usadas recientemente
- Temas claro/oscuro conmutables
