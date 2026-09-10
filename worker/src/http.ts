export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveCorsOrigin(request: Request, allowedRaw: string | undefined): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  const allowed = parseAllowedOrigins(allowedRaw);
  if (allowed.includes(origin)) return origin;

  // Permite previews de Pages: https://hash.ct-toolkit.pages.dev
  if (origin.endsWith('.ct-toolkit.pages.dev') || origin === 'https://ct-toolkit.pages.dev') {
    return origin;
  }

  return null;
}

export function corsHeaders(request: Request, allowedRaw: string | undefined): HeadersInit {
  const origin = resolveCorsOrigin(request, allowedRaw);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

export function withCors(
  response: Response,
  request: Request,
  allowedRaw: string | undefined,
): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request, allowedRaw);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
