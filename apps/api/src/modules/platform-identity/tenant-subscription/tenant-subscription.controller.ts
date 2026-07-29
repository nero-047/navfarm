import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantSubscriptionService } from './tenant-subscription.service';
import { CreateTenantSubscriptionDto } from './dto/tenant-subscription.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Tenant Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenant/subscription')
export class TenantSubscriptionController {
  constructor(private readonly svc: TenantSubscriptionService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update tenant subscription plan + feature flags' })
  async upsertSubscription(@Body() dto: CreateTenantSubscriptionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.upsertSubscription(tenantId, dto);
    return { success: true, message: `Subscription ${result.action}.`, data: result };
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get subscription plan and feature flags for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID' })
  async getSubscription(@Param('tenantId') tenantId: string) {
    const result = await this.svc.getSubscription(tenantId);
    return { success: true, message: 'Subscription retrieved.', data: result };
  }
}
