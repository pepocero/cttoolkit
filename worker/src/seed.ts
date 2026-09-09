import seedData from './seedData.json' with { type: 'json' };
import { createId, hashPassword, normalizeEmail } from './crypto';
import {
  createUser,
  emptyAppData,
  findUserIdByEmail,
  getUserData,
  saveUserData,
  updateAccountPassword,
} from './store';
import type { AppDataRecord, Env, UserAccount } from './types';

let seedPromise: Promise<void> | null = null;

function cloneSeedData(): AppDataRecord {
  return structuredClone(seedData) as AppDataRecord;
}

export async function ensureSeedUser(env: Env): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const email = normalizeEmail(env.SEED_USER_EMAIL || 'pepocero@gmail.com');
      const password = env.SEED_USER_PASSWORD;
      if (!password || password.length < 8) {
        console.warn('SEED_USER_PASSWORD ausente o demasiado corta; no se crea el usuario semilla.');
        return;
      }

      const existingId = await findUserIdByEmail(env, email);
      if (existingId) {
        const data = await getUserData(env, existingId);
        if (!data) {
          await saveUserData(env, existingId, cloneSeedData());
        }

        const { hash, salt } = await hashPassword(password);
        await updateAccountPassword(env, existingId, hash, salt);
        return;
      }

      const now = new Date().toISOString();
      const { hash, salt } = await hashPassword(password);
      const account: UserAccount = {
        id: createId('user'),
        email,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: now,
        updatedAt: now,
      };

      await createUser(env, account, cloneSeedData());
      console.log(`Usuario semilla creado en D1: ${email}`);
    })();
  }

  try {
    await seedPromise;
  } catch (error) {
    seedPromise = null;
    throw error;
  }
}

export function initialDataForEmail(email: string, seedEmail: string): AppDataRecord {
  if (normalizeEmail(email) === normalizeEmail(seedEmail)) {
    return cloneSeedData();
  }
  return emptyAppData();
}
