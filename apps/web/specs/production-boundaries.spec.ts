import { unwrap } from '../src/modules/workspace/api-response';
import { normalizeCompany } from '../src/modules/company/types';

describe('production frontend boundaries', () => {
  it('unwraps the API response envelope without fabricating rows', () => {
    const records = [{ batch_id: 'batch-1', status: 'ACTIVE' }];
    expect(unwrap({ success: true, data: records })).toEqual(records);
    expect(unwrap(records)).toEqual(records);
  });

  it('normalizes only the company returned by the API', () => {
    expect(
      normalizeCompany({
        slug: 'farm-a-12345678',
        name: 'Farm A',
        nobCode: 'POULTRY',
      }),
    ).toMatchObject({
      slug: 'farm-a-12345678',
      name: 'Farm A',
      nobName: 'Poultry',
      setupProgress: 0,
    });
  });
});
