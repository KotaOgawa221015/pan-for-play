import { z } from 'zod';

type RawEnv = Record<string, string | undefined>;
type GoogleAuthConfiguration =
  | {
      isEnabled: false;
    }
  | {
      isEnabled: true;
      clientId: string;
      clientSecret: string;
    };

const requiredString = (name: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value : ''),
    z.string().min(1, { message: `${name} is required.` }),
  );

const optionalString = () =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.length > 0 ? value : undefined,
    z.string().optional(),
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
  TURSO_AUTH_TOKEN: optionalString(),
});

const authEnvSchema = z.object({
  AUTH_SECRET: optionalString(),
  AUTH_GOOGLE_ID: optionalString(),
  AUTH_GOOGLE_SECRET: optionalString(),
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
  TURSO_DATABASE_GROUP: optionalString(),
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

function resolveGoogleAuthConfiguration(
  raw: z.infer<typeof authEnvSchema>,
  nodeEnv: string | undefined,
): GoogleAuthConfiguration {
  const clientId = raw.AUTH_GOOGLE_ID;
  const clientSecret = raw.AUTH_GOOGLE_SECRET;
  const hasGoogleId = clientId !== undefined;
  const hasGoogleSecret = clientSecret !== undefined;

  if (hasGoogleId !== hasGoogleSecret) {
    throw new Error(
      'AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set together.',
    );
  }

  if (!hasGoogleId || !hasGoogleSecret) {
    if (nodeEnv === 'development') {
      console.warn(
        'AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are not set. Google sign-in is disabled.',
      );
      return { isEnabled: false };
    }

    throw new Error('AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required.');
  }

  return {
    isEnabled: true,
    clientId,
    clientSecret,
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

  const googleProvider = resolveGoogleAuthConfiguration(parsed, nodeEnv);

  return {
    authSecret,
    googleProvider,
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
