import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter, isDuplicateEntry } from './http-exception.filter';

describe('duplicate identity failures', () => {
  it('recognizes raw and Drizzle-wrapped duplicate errors', () => {
    expect(isDuplicateEntry({ code: 'ER_DUP_ENTRY' })).toBe(true);
    expect(isDuplicateEntry({ cause: { code: 'ER_DUP_ENTRY' } })).toBe(true);
    expect(isDuplicateEntry({ code: 'ER_BAD_FIELD_ERROR' })).toBe(false);
    const circular: { cause?: unknown } = {}; circular.cause = circular;
    expect(isDuplicateEntry(circular)).toBe(false);
  });
  it('returns 409 without leaking the SQL or private conflicting value', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => response, getRequest: () => ({ url: '/reason' }) }) } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch({ message: 'INSERT private-value', cause: { code: 'ER_DUP_ENTRY', sql: 'private SQL' } }, host);
    expect(response.status).toHaveBeenCalledWith(409);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('private');
  });
});
