import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ClsService } from 'nestjs-cls';
import { EncryptionService } from '../encryption/encryption.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let encryptionService: EncryptionService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbDelete = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
  };

  const found = (row: any) => ({
    from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([row]) }) }),
  });

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((v: string) => `enc(${v})`),
            decrypt: jest.fn((v: string) => v.replace(/^enc\(/, '').replace(/\)$/, '')),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  describe('create', () => {
    it('encrypts smtp_password before insert and never stores it as plaintext', async () => {
      let insertedValues: any;
      mockDbInsert.mockReturnValue({ values: jest.fn().mockImplementation((v) => { insertedValues = v; return Promise.resolve({}); }) });
      mockDbSelect.mockReturnValueOnce(
        found({ notif_id: 'n-1', channel: 'EMAIL', smtp_password_enc: 'enc(hunter2)', sms_api_key_enc: null, push_fcm_key_enc: null, webhook_secret_enc: null }),
      );

      const result = await service.create({ company_id: 'c-1', channel: 'EMAIL', smtp_password: 'hunter2' });

      expect(encryptionService.encrypt).toHaveBeenCalledWith('hunter2');
      expect(insertedValues.smtp_password_enc).toBe('enc(hunter2)');
      expect((result as any).smtp_password_enc).toBeUndefined();
      expect((result as any).smtp_password_configured).toBe(true);
    });
  });

  describe('findOne / findByCompany', () => {
    it('never exposes any *_enc column, only *_configured booleans', async () => {
      mockDbSelect.mockReturnValueOnce(
        found({
          notif_id: 'n-1',
          channel: 'EMAIL',
          smtp_password_enc: 'enc(hunter2)',
          sms_api_key_enc: null,
          push_fcm_key_enc: null,
          webhook_secret_enc: 'enc(whsec)',
        }),
      );

      const result: any = await service.findOne('n-1');

      expect(result.smtp_password_enc).toBeUndefined();
      expect(result.sms_api_key_enc).toBeUndefined();
      expect(result.push_fcm_key_enc).toBeUndefined();
      expect(result.webhook_secret_enc).toBeUndefined();
      expect(result.smtp_password_configured).toBe(true);
      expect(result.sms_api_key_configured).toBe(false);
      expect(result.webhook_secret_configured).toBe(true);
    });
  });

  describe('update', () => {
    it('re-encrypts a changed secret and leaves untouched secrets alone', async () => {
      mockDbSelect
        .mockReturnValueOnce(found({ notif_id: 'n-1', channel: 'EMAIL', smtp_password_enc: 'enc(old)' }))
        .mockReturnValueOnce(found({ notif_id: 'n-1', channel: 'EMAIL', smtp_password_enc: 'enc(newpass)' }));

      let setValues: any;
      mockDbUpdate.mockReturnValue({ set: jest.fn().mockImplementation((v) => { setValues = v; return { where: jest.fn().mockResolvedValue({}) }; }) });

      const result: any = await service.update('n-1', { smtp_password: 'newpass' });

      expect(encryptionService.encrypt).toHaveBeenCalledWith('newpass');
      expect(setValues.smtp_password_enc).toBe('enc(newpass)');
      expect(setValues.smtp_password).toBeUndefined();
      expect(result.smtp_password_configured).toBe(true);
    });
  });
});
