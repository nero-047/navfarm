import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QualityPlanService } from '../services/quality-plan.service';
import { CreateQualityPlanDto } from '../dto/quality-plan.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Inspection Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/plan')
export class QualityPlanController {
  constructor(private readonly planService: QualityPlanService) {}

  @Post()
  @RequirePermission('QUALITY', 'PLAN', 'create')
  @ApiOperation({ summary: 'Create Quality Inspection Plan with test parameters' })
  async createQualityPlan(@Body() dto: CreateQualityPlanDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.planService.createQualityPlan(dto, tenantId);
    return {
      success: true,
      message: 'Quality inspection plan created.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('QUALITY', 'PLAN', 'view')
  @ApiOperation({ summary: 'List Quality Inspection Plans for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getQualityPlans(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.planService.getQualityPlans(companyId, tenantId);
    return {
      success: true,
      message: 'Quality plans retrieved.',
      data: result,
    };
  }
}
