import {
  createId,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  signSession,
  verifyPassword,
  verifySession,
} from './crypto';
import { error, json, readJson } from './http';
import { ensureSeedUser, initialDataForEmail } from './seed';
import {
  SESSION_DAYS,
  clearSessionCookie,
  createUser,
  findUserIdByEmail,
  getAccount,
  getUserData,
  isValidAppData,
  readSessionToken,
  saveUserData,
  sessionCookie,
} from './store';
import type { Env, SessionPayload } from './types';

interface AuthBody {
  email?: string;
  password?: string;
}

async function requireSession(
  request: Request,
  env: Env,
): Promise<{ session: SessionPayload } | Response> {
  const token = readSessionToken(request);
  if (!token) return error('No autenticado', 401);
  if (!env.AUTH_SECRET) return error('AUTH_SECRET no configurado', 500);

  const session = await verifySession(token, env.AUTH_SECRET);
  if (!session) return error('Sesión inválida o caducada', 401);
  return { session };
}

function publicUser(session: SessionPayload) {
  return { id: session.sub, email: session.email };
}

async function issueSession(
  request: Request,
  env: Env,
  userId: string,
  email: string,
): Promise<Response> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const token = await signSession({ sub: userId, email, exp }, env.AUTH_SECRET);
  const headers = new Headers({
    'Set-Cookie': sessionCookie(token, request.url),
  });
  return json(
    {
      user: { id: userId, email },
      expiresAt: new Date(exp * 1000).toISOString(),
    },
    { headers },
  );
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  await ensureSeedUser(env);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (method === 'GET' && path === '/api/health') {
    return json({ ok: true, service: 'ct-toolkit' });
  }

  if (method === 'POST' && path === '/api/auth/register') {
    if (env.ALLOW_REGISTRATION !== 'true') {
      return error('El registro está deshabilitado', 403);
    }

    const body = await readJson<AuthBody>(request);
    const email = normalizeEmail(body?.email ?? '');
    const password = body?.password ?? '';

    if (!isValidEmail(email)) return error('Email no válido');
    if (password.length < 8) return error('La contraseña debe tener al menos 8 caracteres');

    const existing = await findUserIdByEmail(env, email);
    if (existing) return error('Ya existe una cuenta con ese email', 409);

    const now = new Date().toISOString();
    const { hash, salt } = await hashPassword(password);
    const userId = createId('user');

    try {
      await createUser(
        env,
        {
          id: userId,
          email,
          passwordHash: hash,
          passwordSalt: salt,
          createdAt: now,
          updatedAt: now,
        },
        initialDataForEmail(email, env.SEED_USER_EMAIL),
      );
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return error('Ya existe una cuenta con ese email', 409);
      }
      throw err;
    }

    return issueSession(request, env, userId, email);
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await readJson<AuthBody>(request);
    const email = normalizeEmail(body?.email ?? '');
    const password = body?.password ?? '';

    if (!isValidEmail(email) || !password) {
      return error('Email o contraseña incorrectos', 401);
    }

    const userId = await findUserIdByEmail(env, email);
    if (!userId) return error('Email o contraseña incorrectos', 401);

    const account = await getAccount(env, userId);
    if (!account) return error('Email o contraseña incorrectos', 401);

    const ok = await verifyPassword(password, account.passwordSalt, account.passwordHash);
    if (!ok) return error('Email o contraseña incorrectos', 401);

    return issueSession(request, env, account.id, account.email);
  }

  if (method === 'POST' && path === '/api/auth/logout') {
    return json(
      { ok: true },
      { headers: { 'Set-Cookie': clearSessionCookie(request.url) } },
    );
  }

  if (method === 'GET' && path === '/api/auth/me') {
    const result = await requireSession(request, env);
    if (result instanceof Response) return result;
    return json({ user: publicUser(result.session) });
  }

  if (method === 'GET' && path === '/api/data') {
    const result = await requireSession(request, env);
    if (result instanceof Response) return result;

    const data = await getUserData(env, result.session.sub);
    if (!data) {
      return json({ version: 1, panels: [] });
    }
    return json(data);
  }

  if (method === 'PUT' && path === '/api/data') {
    const result = await requireSession(request, env);
    if (result instanceof Response) return result;

    const body = await readJson<unknown>(request);
    if (!isValidAppData(body)) {
      return error('Estructura de datos no válida');
    }

    const payload = {
      version: typeof body.version === 'number' ? body.version : 1,
      panels: body.panels,
    };

    await saveUserData(env, result.session.sub, payload);
    return json({ ok: true, updatedAt: new Date().toISOString() });
  }

  return error('Ruta no encontrada', 404);
}
