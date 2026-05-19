import { z } from 'zod';

type RawEnv = Record<string, string | undefined>;

const requiredString = (name: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value : ''),
    z.string().min(1, { message: `${name} is required.` }),
  );

const optionalString = (name: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value : undefined),
    z
      .string()
      .min(1, { message: `${name} must not be empty.` })
      .optional(),
  );

function parseEnv<T extends z.ZodTypeAny>(schema: T, raw: RawEnv) {
  const result = schema.safeParse(raw);

  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(issue?.message ?? 'Invalid environment variables.');
  }

  return result.data;
}

const databaseEnvSchema = z.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
});

const prismaEnvSchema = z.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
  TURSO_AUTH_TOKEN: optionalString('TURSO_AUTH_TOKEN'),
});

const authEnvSchema = z.object({
  AUTH_SECRET: optionalString('AUTH_SECRET'),
  AUTH_GOOGLE_ID: requiredString('AUTH_GOOGLE_ID'),
  AUTH_GOOGLE_SECRET: requiredString('AUTH_GOOGLE_SECRET'),
  NODE_ENV: z.string().optional(),
});

const tursoEnvSchema = z.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
  TURSO_AUTH_TOKEN: requiredString('TURSO_AUTH_TOKEN'),
});

const tursoRecreateEnvSchema = z.object({
  DATABASE_URL: requiredString('DATABASE_URL'),
  TURSO_DATABASE_NAME: requiredString('TURSO_DATABASE_NAME'),
  TURSO_AUTH_TOKEN_EXPIRATION: requiredString('TURSO_AUTH_TOKEN_EXPIRATION'),
  TURSO_DATABASE_GROUP: optionalString('TURSO_DATABASE_GROUP'),
});

const systemTestPortSchema = z.coerce.number().int().positive();

export function requireDatabaseUrl(raw: RawEnv = process.env) {
  return parseEnv(databaseEnvSchema, raw).DATABASE_URL;
}

export function getPrismaEnv(raw: RawEnv = process.env) {
  const parsed = parseEnv(prismaEnvSchema, raw);

  return {
    databaseUrl: parsed.DATABASE_URL,
    tursoAuthToken: parsed.TURSO_AUTH_TOKEN,
  };
}

export function getAuthEnv(raw: RawEnv = process.env) {
  const parsed = parseEnv(authEnvSchema, raw);
  const nodeEnv = raw.NODE_ENV;
  const authSecret =
    parsed.AUTH_SECRET ??
    (nodeEnv === 'development' ? 'development-only-secret' : undefined);

  if (!authSecret) {
    throw new Error('AUTH_SECRET is required.');
  }

  if (!parsed.AUTH_SECRET && nodeEnv === 'development') {
    console.warn('AUTH_SECRET is not set. Using development-only-secret.');
  }

  return {
    authSecret,
    authGoogleId: parsed.AUTH_GOOGLE_ID,
    authGoogleSecret: parsed.AUTH_GOOGLE_SECRET,
    nodeEnv,
  };
}

export function getTursoEnv(raw: RawEnv = process.env) {
  const parsed = parseEnv(tursoEnvSchema, raw);

  return {
    databaseUrl: parsed.DATABASE_URL,
    tursoAuthToken: parsed.TURSO_AUTH_TOKEN,
  };
}

export function getTursoRecreateEnv(raw: RawEnv = process.env) {
  const parsed = parseEnv(tursoRecreateEnvSchema, raw);

  return {
    databaseUrl: parsed.DATABASE_URL,
    tursoDatabaseName: parsed.TURSO_DATABASE_NAME,
    tursoAuthTokenExpiration: parsed.TURSO_AUTH_TOKEN_EXPIRATION,
    tursoDatabaseGroup: parsed.TURSO_DATABASE_GROUP,
  };
}

export function getSystemTestPort(raw: RawEnv = process.env, fallback = 3000) {
  const value = raw.PANCOLLE_SYSTEM_TEST_PORT;

  if (value === undefined) {
    console.warn(`PANCOLLE_SYSTEM_TEST_PORT is not set. Using ${fallback}.`);
    return fallback;
  }

  const parsed = systemTestPortSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error(
      `PANCOLLE_SYSTEM_TEST_PORT must be a positive integer: received "${value}"`,
    );
  }

  return parsed.data;
}
