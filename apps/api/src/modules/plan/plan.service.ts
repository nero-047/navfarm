import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import * as masterSchema from '../../core/database/master-schema';
import { MASTER_CONNECTION } from '../../core/database/database.module';

@Injectable()
export class PlanService {
  constructor(
    @Inject(MASTER_CONNECTION)
    private readonly db: MySql2Database<typeof masterSchema>,
  ) {}

  async findAll() {
    return this.db.select().from(masterSchema.planMaster);
  }

  async findOne(id: string) {
    const [plan] = await this.db
      .select()
      .from(masterSchema.planMaster)
      .where(eq(masterSchema.planMaster.plan_id, id))
      .limit(1);

    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found.`);
    }

    return plan;
  }

  async create(data: any) {
    await this.db.insert(masterSchema.planMaster).values(data);
    const [plan] = await this.db
      .select()
      .from(masterSchema.planMaster)
      .where(eq(masterSchema.planMaster.plan_id, data.plan_id))
      .limit(1);
    return plan;
  }

  async update(id: string, data: any) {
    await this.db
      .update(masterSchema.planMaster)
      .set(data)
      .where(eq(masterSchema.planMaster.plan_id, id));
    
    const [plan] = await this.db
      .select()
      .from(masterSchema.planMaster)
      .where(eq(masterSchema.planMaster.plan_id, id))
      .limit(1);
    return plan;
  }

  async remove(id: string) {
    const [plan] = await this.db
      .select()
      .from(masterSchema.planMaster)
      .where(eq(masterSchema.planMaster.plan_id, id))
      .limit(1);
    
    await this.db
      .delete(masterSchema.planMaster)
      .where(eq(masterSchema.planMaster.plan_id, id));
    
    return plan;
  }
}
