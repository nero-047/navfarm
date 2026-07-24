export function configuredHybridMockEndpoints(): Set<string> {
  return new Set(
    (process.env.NAVFARM_HYBRID_MOCK_ENDPOINTS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function shouldHybridFallback(method: string, path: string, upstreamStatus: number): boolean {
  if (upstreamStatus !== 404 && upstreamStatus !== 501) return false;
  const configured = configuredHybridMockEndpoints();
  return configured.has(`${method.toUpperCase()} ${path}`);
}
