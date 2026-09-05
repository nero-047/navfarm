import { ValidationPipe } from '@nestjs/common';
import { QueryLocationTypeDto } from './location-type/dto/location-type.dto';
import { QueryLocationDto } from './location/dto/location.dto';
import { QueryUomDto } from './uom/dto/uom.dto';
import { QueryFarmDto } from './farm/dto/farm.dto';
import { QueryBreedDto, QuerySpeciesDto } from './breed/dto/breed.dto';
import { QueryItemDto } from './item/dto/item.dto';
import { QueryItemCategoryDto } from './item-category/dto/item-category.dto';
import { QueryItemTypeDto } from './item-type/dto/item-type.dto';
import { QueryStageDto } from '../production/stage/dto/stage.dto';
import { QueryNumberSeriesDto } from '../system/number-series/dto/number-series.dto';
import { QueryGlAccountDto } from '../finance/gl-account/dto/gl-account.dto';
import { QueryCostCenterDto } from '../finance/cost-center/dto/cost-center.dto';
import { QueryAnimalDto } from '../piggery/animal/dto/animal.dto';
import { QueryGoodsReceiptDto } from '../inventory/goods-receipt/dto/goods-receipt.dto';
import { QueryBatchDto } from '../production/batch/dto/batch.dto';

/**
 * Entity picker dropdowns (MasterDataTable.tsx's select-entity fields) fetch
 * from list endpoints with `isActive=true` appended, so the form only offers
 * rows the API will actually accept — a picker must not offer a value its own
 * API then rejects (see location.service.ts assertUomExists vs. the old
 * uom.service.ts findAll, which deliberately omits an isNull(deleted_at)
 * filter so the *list page* can show Active/Inactive rows for restore).
 *
 * main.ts runs the global ValidationPipe with forbidNonWhitelisted, so a query
 * param a DTO does not declare 400s the whole request — exactly the class
 * this project already regression-tests in
 * production/list-dto-company-scope.spec.ts for `companyId`. This test does
 * the same for `isActive` across every list DTO a picker in
 * master-data/configs.ts can reach (directly, or via an endpoint outside
 * master-data such as /stage, /animal, /batch, /goods-receipt, /number-series,
 * /gl-account, /cost-center). Some of these entities (goods receipts, batches)
 * have no is_active column at all — findAll for those already unconditionally
 * excludes soft-deleted rows, so isActive is declared but otherwise inert;
 * it still must be whitelisted or the picker's request 400s.
 */
describe('list DTOs reachable from a select-entity picker accept isActive', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const cases: Array<[string, new () => object]> = [
    ['QueryLocationTypeDto', QueryLocationTypeDto],
    ['QueryLocationDto', QueryLocationDto],
    ['QueryUomDto', QueryUomDto],
    ['QueryFarmDto', QueryFarmDto],
    ['QueryStageDto', QueryStageDto],
    ['QueryBreedDto', QueryBreedDto],
    ['QuerySpeciesDto', QuerySpeciesDto],
    ['QueryItemDto', QueryItemDto],
    ['QueryItemCategoryDto', QueryItemCategoryDto],
    ['QueryItemTypeDto', QueryItemTypeDto],
    ['QueryNumberSeriesDto', QueryNumberSeriesDto],
    ['QueryGlAccountDto', QueryGlAccountDto],
    ['QueryCostCenterDto', QueryCostCenterDto],
    ['QueryAnimalDto', QueryAnimalDto],
    ['QueryGoodsReceiptDto', QueryGoodsReceiptDto],
    ['QueryBatchDto', QueryBatchDto],
  ];

  it.each(cases)('%s accepts isActive=true', async (_name, metatype) => {
    await expect(
      pipe.transform({ isActive: 'true' }, { type: 'query', metatype }),
    ).resolves.toBeDefined();
  });

  it.each(cases)('%s accepts isActive alongside limit like a real picker fetch', async (_name, metatype) => {
    await expect(
      pipe.transform({ isActive: 'true', limit: '500' }, { type: 'query', metatype }),
    ).resolves.toBeDefined();
  });

  it.each(cases)('%s still rejects an undeclared param', async (_name, metatype) => {
    await expect(
      pipe.transform({ bogusParam: 'x' }, { type: 'query', metatype }),
    ).rejects.toThrow();
  });
});
