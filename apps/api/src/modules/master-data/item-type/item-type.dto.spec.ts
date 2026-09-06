import { ValidationPipe } from '@nestjs/common';
import { UpdateItemTypeDto } from './dto/item-type.dto';

/**
 * item_master.item_type stores the type_code string and item.service.ts branches
 * on the literals 'MEDICINE'/'VACCINE' for withdrawal_days, so renaming a code
 * after create silently detaches every item from that rule. The code is
 * immutable, exactly as UpdateLocationTypeDto has no type_code — and main.ts
 * runs the global pipe with forbidNonWhitelisted, so the field is a 400.
 */
describe('UpdateItemTypeDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const meta = { type: 'body' as const, metatype: UpdateItemTypeDto };

  it('rejects a type_code — the code is immutable after create', async () => {
    await expect(pipe.transform({ type_name: 'Medicine', type_code: 'MED' }, meta)).rejects.toThrow();
  });

  it('still accepts the editable fields', async () => {
    await expect(
      pipe.transform({ type_name: 'Medicine', description: 'Vet supplies', is_active: true }, meta),
    ).resolves.toBeDefined();
  });
});
