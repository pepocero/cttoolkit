# Mejoras futuras

## Sincronización entre dispositivos

**Implementado:** Cloudflare Worker + **D1** + autenticación **JWT** por usuario.

Pendiente:

- Resolución de conflictos avanzada
- Sincronización en tiempo real

## Backend en Cloudflare

- **Workers + D1 + JWT:** implementado
- **R2 (opcional):** adjuntos o backups binarios
- **KV:** caché de sesiones si se escala

## Usuarios y multitenancy

- **Implementado:** cuentas por técnico y datos aislados por `user_id` en D1
- Pendiente: paneles compartidos de solo lectura

## Paneles compartidos

- Enlaces de solo lectura firmados
- Plantillas de organización

## PWA

- Manifest + service worker
- Uso offline de assets

## Seguridad avanzada

- 2FA / passkeys
- Cifrado de valores sensibles
- Rotación de JWT / refresh tokens
