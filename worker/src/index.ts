import { handleApi } from './routes';
import { withCors } from './http';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return withCors(new Response(null, { status: 204 }), request);
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        if (!env.AUTH_SECRET) {
          return withCors(
            new Response(JSON.stringify({ error: 'AUTH_SECRET no configurado' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }),
            request,
          );
        }
        const response = await handleApi(request, env);
        return withCors(response, request);
      } catch (err) {
        console.error(err);
        return withCors(
          new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
          request,
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('CT Toolkit API', { status: 200 });
  },
} satisfies ExportedHandler<Env>;
