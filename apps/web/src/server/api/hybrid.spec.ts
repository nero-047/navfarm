import { shouldHybridFallback } from './hybrid';

describe('hybrid fallback policy', () => {
  const original = process.env.NAVFARM_HYBRID_MOCK_ENDPOINTS;
  afterEach(() => { process.env.NAVFARM_HYBRID_MOCK_ENDPOINTS = original; });

  it('never hides upstream validation or server failures', () => {
    process.env.NAVFARM_HYBRID_MOCK_ENDPOINTS = 'GET /demo/example';
    expect(shouldHybridFallback('GET', '/demo/example', 422)).toBe(false);
    expect(shouldHybridFallback('GET', '/demo/example', 500)).toBe(false);
    expect(shouldHybridFallback('GET', '/demo/example', 503)).toBe(false);
  });
  it('falls back only for explicitly unimplemented development endpoints', () => {
    process.env.NAVFARM_HYBRID_MOCK_ENDPOINTS = 'GET /demo/example';
    expect(shouldHybridFallback('GET', '/demo/example', 404)).toBe(true);
    expect(shouldHybridFallback('POST', '/demo/example', 404)).toBe(false);
    expect(shouldHybridFallback('GET', '/other', 404)).toBe(false);
  });
});
