export type ApiMode = 'mock' | 'proxy' | 'hybrid';

export function getApiMode(): ApiMode {
  const configured = process.env.NAVFARM_API_MODE ?? 'mock';
  if (configured !== 'mock' && configured !== 'proxy' && configured !== 'hybrid') {
    throw new Error(`Unsupported NAVFARM_API_MODE: ${configured}`);
  }
  if (configured === 'hybrid' && process.env.NODE_ENV !== 'development') {
    throw new Error('NAVFARM_API_MODE=hybrid is development-only.');
  }
  return configured;
}
