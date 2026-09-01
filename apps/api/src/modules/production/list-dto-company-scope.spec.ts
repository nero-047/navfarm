import { ValidationPipe } from '@nestjs/common';
import { QueryBatchTransferDto } from './batch/dto/batch.dto';
import { QueryApprovalDto } from './approval/dto/approval.dto';
import { QueryMilkDto } from './milk/dto/milk.dto';
import { QueryBreedLifecycleStageDto } from '../master-data/breed/dto/breed.dto';

/**
 * main.ts runs the global pipe with forbidNonWhitelisted, so any query param a
 * DTO does not declare fails the whole request with 400. The console appends
 * the active company as `companyId` (camelCase) to its list requests, while
 * these DTOs only declared `company_id` — so the page rendered an empty state
 * over data that was really there.
 */
describe('list DTOs accept the console company scope param', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const COMPANY = '7f9d3d0e-1c2b-4a5e-9f11-2b3c4d5e6f70';

  const cases: Array<[string, new () => object]> = [
    ['QueryBatchTransferDto', QueryBatchTransferDto],
    ['QueryApprovalDto', QueryApprovalDto],
    ['QueryMilkDto', QueryMilkDto],
    ['QueryBreedLifecycleStageDto', QueryBreedLifecycleStageDto],
  ];

  it.each(cases)('%s accepts companyId', async (_name, metatype) => {
    await expect(
      pipe.transform({ companyId: COMPANY }, { type: 'query', metatype }),
    ).resolves.toBeDefined();
  });

  it.each(cases)('%s accepts limit and offset like every other list endpoint', async (_name, metatype) => {
    // Every other list DTO takes these. Omitting them here means the moment a
    // screen paginates one of these lists it 400s the whole request.
    await expect(
      pipe.transform({ companyId: COMPANY, limit: 200, offset: 0 }, { type: 'query', metatype }),
    ).resolves.toBeDefined();
  });

  it.each(cases)('%s still rejects an undeclared param', async (_name, metatype) => {
    await expect(
      pipe.transform({ bogusParam: 'x' }, { type: 'query', metatype }),
    ).rejects.toThrow();
  });
});
