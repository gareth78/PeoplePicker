const requiredEnvVars = ['OKTA_ORG_URL', 'OKTA_API_TOKEN'] as const;

type RequiredEnv = (typeof requiredEnvVars)[number];

type EnvConfig = Record<RequiredEnv, string> & {
  NODE_ENV: string;
  REDIS_URL?: string;
};

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) {
    return cachedEnv;
  }

  const missing: string[] = [];
  const entries: Partial<EnvConfig> = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    REDIS_URL: process.env.REDIS_URL
  };

  for (const key of requiredEnvVars) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      entries[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  cachedEnv = entries as EnvConfig;
  return cachedEnv;
}
