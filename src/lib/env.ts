import { z } from "zod";

const envSchema = z.object({
  ACTUAL_SERVER_URL: z.string().url().optional(),
  ACTUAL_SERVER_PASSWORD: z.string().optional(),
  ACTUAL_SYNC_ID: z.string().optional(),
  ACTUAL_E2E_PASSWORD: z.string().optional(),
  ACTUAL_DATA_DIR: z.string().default(".data/actual-cache"),
  SETTINGS_PATH: z.string().default(".data/settings.json"),
  SYNC_INTERVAL_MS: z.coerce.number().default(300_000),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse(process.env);
}

export function isActualConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.ACTUAL_SERVER_URL && env.ACTUAL_SERVER_PASSWORD && env.ACTUAL_SYNC_ID
  );
}
