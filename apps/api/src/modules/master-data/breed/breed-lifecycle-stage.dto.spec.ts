import { ValidationPipe } from '@nestjs/common';
import { QueryBreedLifecycleStageDto } from './dto/breed.dto';

/**
 * main.ts configures the global pipe with forbidNonWhitelisted, so any query
 * param a DTO does not declare becomes a 400. MasterDataTable sends companyId
 * on every master-data list request, which made this page unusable.
 */
describe('QueryBreedLifecycleStageDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const meta = { type: 'query' as const, metatype: QueryBreedLifecycleStageDto };

  it('accepts the companyId scope param the master-data table always sends', async () => {
    await expect(
      pipe.transform({ companyId: '7f9d3d0e-1c2b-4a5e-9f11-2b3c4d5e6f70', limit: 5 }, meta),
    ).resolves.toBeDefined();
  });

  it('still rejects a genuinely unknown param', async () => {
    await expect(pipe.transform({ bogusParam: 'x' }, meta)).rejects.toThrow();
  });
});
