import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class LanguageService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async listLanguages() {
    return this.db.select().from(schema.languageMaster).where(eq(schema.languageMaster.is_active, true));
  }

  async resolveTranslation(
    userId: string | null,
    companyId: string,
    moduleCode: string,
    key: string,
  ): Promise<string> {
    let resolvedLangId: string | null = null;

    // 1. Resolve User Preference Language
    if (userId) {
      const [userPref] = await this.db
        .select()
        .from(schema.userLanguagePref)
        .where(and(eq(schema.userLanguagePref.user_id, userId), eq(schema.userLanguagePref.is_active, true)))
        .limit(1);
      if (userPref) {
        resolvedLangId = userPref.lang_id;
      }
    }

    // 2. Fallback to Company Default Language
    if (!resolvedLangId) {
      const [company] = await this.db
        .select()
        .from(schema.companyMaster)
        .where(eq(schema.companyMaster.company_id, companyId))
        .limit(1);
      if (company && company.default_language_id !== '00000000-0000-0000-0000-000000000000') {
        resolvedLangId = company.default_language_id;
      }
    }

    // 3. Fallback to System Default Language (English)
    if (!resolvedLangId) {
      const [sysDefault] = await this.db
        .select()
        .from(schema.languageMaster)
        .where(eq(schema.languageMaster.is_system_default, true))
        .limit(1);
      
      if (sysDefault) {
        resolvedLangId = sysDefault.lang_id;
      } else {
        const [anyLang] = await this.db.select().from(schema.languageMaster).limit(1);
        if (anyLang) {
          resolvedLangId = anyLang.lang_id;
        }
      }
    }

    if (!resolvedLangId) {
      return key;
    }

    // Query translation label
    const [translation] = await this.db
      .select()
      .from(schema.languageTranslations)
      .where(
        and(
          eq(schema.languageTranslations.lang_id, resolvedLangId),
          eq(schema.languageTranslations.module_code, moduleCode),
          eq(schema.languageTranslations.translation_key, key)
        )
      )
      .limit(1);

    if (translation) {
      return translation.translation_value;
    }

    // If key not found, fallback to English (System Default) value if different from resolvedLang
    const [sysDefault] = await this.db
      .select()
      .from(schema.languageMaster)
      .where(eq(schema.languageMaster.is_system_default, true))
      .limit(1);

    if (sysDefault && sysDefault.lang_id !== resolvedLangId) {
      const [englishTranslation] = await this.db
        .select()
        .from(schema.languageTranslations)
        .where(
          and(
            eq(schema.languageTranslations.lang_id, sysDefault.lang_id),
            eq(schema.languageTranslations.module_code, moduleCode),
            eq(schema.languageTranslations.translation_key, key)
          )
        )
        .limit(1);
      if (englishTranslation) {
        return englishTranslation.translation_value;
      }
    }

    return key;
  }

  async addTranslation(langId: string, moduleCode: string, key: string, value: string) {
    const transId = randomUUID();
    await this.db
      .insert(schema.languageTranslations)
      .values({
        trans_id: transId,
        lang_id: langId,
        module_code: moduleCode,
        translation_key: key,
        translation_value: value,
      });
    
    const [newTrans] = await this.db
      .select()
      .from(schema.languageTranslations)
      .where(eq(schema.languageTranslations.trans_id, transId))
      .limit(1);
    return newTrans;
  }

  async createLanguage(data: any) {
    const langId = data.lang_id || randomUUID();
    await this.db.insert(schema.languageMaster).values({
      ...data,
      lang_id: langId,
    });
    
    const [newLang] = await this.db
      .select()
      .from(schema.languageMaster)
      .where(eq(schema.languageMaster.lang_id, langId))
      .limit(1);
    return newLang;
  }

  async updateLanguage(id: string, data: any) {
    await this.db
      .update(schema.languageMaster)
      .set(data)
      .where(eq(schema.languageMaster.lang_id, id));
    
    const [updatedLang] = await this.db
      .select()
      .from(schema.languageMaster)
      .where(eq(schema.languageMaster.lang_id, id))
      .limit(1);
    return updatedLang;
  }

  async deleteLanguage(id: string) {
    const [deletedLang] = await this.db
      .select()
      .from(schema.languageMaster)
      .where(eq(schema.languageMaster.lang_id, id))
      .limit(1);
    
    await this.db
      .delete(schema.languageMaster)
      .where(eq(schema.languageMaster.lang_id, id));
    
    return deletedLang;
  }
}
