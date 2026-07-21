import { SystemController } from './system.controller';

describe('SystemController', () => {
  it('returns a liveness response', () => {
    const response = new SystemController().health();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('navfarm-api');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
