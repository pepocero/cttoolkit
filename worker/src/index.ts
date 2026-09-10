import { handleApi } from './routes';
import { withCors } from './http';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsOrigins = env.CORS_ORIGINS;

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }), request, corsOrigins);
    }

    if (url.pathname === '/' || url.pathname === '') {
      return withCors(
        jsonOk({ service: 'ct-toolkit-api', ok: true }),
        request,
        corsOrigins,
      );
    }

    if (!url.pathname.startsWith('/api/')) {
      return withCors(
        jsonOk({ error: 'Ruta no encontrada' }, 404),
        request,
        corsOrigins,
      );
    }

    try {
      if (!env.AUTH_SECRET) {
        return withCors(
          jsonOk({ error: 'AUTH_SECRET no configurado' }, 500),
          request,
          corsOrigins,
        );
      }
      const response = await handleApi(request, env);
      return withCors(response, request, corsOrigins);
    } catch (err) {
      console.error(err);
      return withCors(
        jsonOk({ error: 'Error interno del servidor' }, 500),
        request,
        corsOrigins,
      );
    }
  },
} satisfies ExportedHandler<Env>;

function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
