import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((value) => value === 'true'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  N8N_PROPOSAL_WEBHOOK_URL: z.string().url().optional(),
});

export const config = envSchema.parse({
  ...process.env,
  DATABASE_HOST: process.env.DB_HOST ?? process.env.DATABASE_HOST,
  DATABASE_PORT: process.env.DB_PORT ?? process.env.DATABASE_PORT,
  DATABASE_USER: process.env.DB_USER ?? process.env.DATABASE_USER,
  DATABASE_PASSWORD: process.env.DB_PASSWORD ?? process.env.DATABASE_PASSWORD,
  DATABASE_NAME: process.env.DB_NAME ?? process.env.DATABASE_NAME,
});
