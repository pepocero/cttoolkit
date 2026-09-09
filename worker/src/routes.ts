import {
  createId,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  signJwt,
  verifyJwt,
  verifyPassword,
} from './crypto';
import { error, json, readJson } from './http';
import { ensureSeedUser, initialDataForEmail } from './seed';
import {
  SESSION_DAYS,
  clearSessionCookie,
  createUser,
  findUserIdByEmail,
  getAccountByEmail,
  getUserData,
  isValidAppData,
  readSessionToken,
  saveUserData,
  sessionCookie,
} from './store';
import type { Env, JwtPayload } from './types';

interface AuthBody {
  email?: string;
  password?: string;
}

async function requireJwt(
  request: Request,
  env: Env,
): Promise<{ jwt: JwtPayload } | Response> {
  const token = readSessionToken(request);
  if (!token) return error('No autenticado', 401);
  if (!env.AUTH_SECRET) return error('AUTH_SECRET no configurado', 500);

  const jwt = await verifyJwt(token, env.AUTH_SECRET);
  if (!jwt) return error('JWT inválido o caducado', 401);
  return { jwt };
}

function publicUser(jwt: JwtPayload) {
  return { id: jwt.sub, email: jwt.email };
}

async function issueJwt(
  request: Request,
  env: Env,
  userId: string,
  email: string,
): Promise<Response> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_DAYS * 24 * 60 * 60;
  const token = await signJwt({ sub: userId, email, iat, exp }, env.AUTH_SECRET);
  const headers = new Headers({
    'Set-Cookie': sessionCookie(token, request.url),
  });
  return json(
    {
      user: { id: userId, email },
      token,
      tokenType: 'Bearer',
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
    return json({ ok: true, service: 'ct-toolkit', storage: 'd1', auth: 'jwt' });
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

    return issueJwt(request, env, userId, email);
  }

  if (method === 'POST' && path === '/api/auth/login') {
    const body = await readJson<AuthBody>(request);
    const email = normalizeEmail(body?.email ?? '');
    const password = body?.password ?? '';

    if (!isValidEmail(email) || !password) {
      return error('Email o contraseña incorrectos', 401);
    }

    const account = await getAccountByEmail(env, email);
    if (!account) return error('Email o contraseña incorrectos', 401);

    const ok = await verifyPassword(password, account.passwordSalt, account.passwordHash);
    if (!ok) return error('Email o contraseña incorrectos', 401);

    return issueJwt(request, env, account.id, account.email);
  }

  if (method === 'POST' && path === '/api/auth/logout') {
    return json(
      { ok: true },
      { headers: { 'Set-Cookie': clearSessionCookie(request.url) } },
    );
  }

  if (method === 'GET' && path === '/api/auth/me') {
    const result = await requireJwt(request, env);
    if (result instanceof Response) return result;
    return json({ user: publicUser(result.jwt) });
  }

  if (method === 'GET' && path === '/api/data') {
    const result = await requireJwt(request, env);
    if (result instanceof Response) return result;

    const data = await getUserData(env, result.jwt.sub);
    if (!data) {
      return json({ version: 1, panels: [] });
    }
    return json(data);
  }

  if (method === 'PUT' && path === '/api/data') {
    const result = await requireJwt(request, env);
    if (result instanceof Response) return result;

    const body = await readJson<unknown>(request);
    if (!isValidAppData(body)) {
      return error('Estructura de datos no válida');
    }

    const payload = {
      version: typeof body.version === 'number' ? body.version : 1,
      panels: body.panels,
    };

    await saveUserData(env, result.jwt.sub, payload);
    return json({ ok: true, updatedAt: new Date().toISOString() });
  }

  return error('Ruta no encontrada', 404);
}
