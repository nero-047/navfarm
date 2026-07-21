import type { ConfigService } from '@nestjs/config';

const DEVELOPMENT_JWT_SECRET = 'navfarm-development-only-secret';

export function resolveJwtSecret(config: ConfigService): string {
  const configured = config.get<string>('JWT_SECRET');
  if (configured) return configured;

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET is required when NODE_ENV=production.');
  }

  return DEVELOPMENT_JWT_SECRET;
}
