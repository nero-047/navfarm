import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportFrameworkService } from '../services/report-framework.service';
import { CreateReportCategoryDto, RegisterReportDefinitionDto } from '../dto/report-framework.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Metadata Framework')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/framework')
export class ReportFrameworkController {
  constructor(private readonly frameworkService: ReportFrameworkService) {}

  @Post('category')
  @RequirePermission('REPORTING', 'FRAMEWORK', 'create')
  @ApiOperation({ summary: 'Create Report Category Metadata' })
  async createCategory(@Body() dto: CreateReportCategoryDto) {
    const result = await this.frameworkService.createCategory(dto);
    return {
      success: true,
      message: 'Report category created.',
      data: result,
    };
  }

  @Post('register')
  @RequirePermission('REPORTING', 'FRAMEWORK', 'create')
  @ApiOperation({ summary: 'Register Analytical Report Definition' })
  async registerReport(@Body() dto: RegisterReportDefinitionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.frameworkService.registerReport(dto, tenantId);
    return {
      success: true,
      message: 'Report definition registered.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('REPORTING', 'FRAMEWORK', 'view')
  @ApiOperation({ summary: 'List Registered Report Definitions for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getReportDefinitions(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.frameworkService.getReportDefinitions(companyId, tenantId);
    return {
      success: true,
      message: 'Report definitions retrieved.',
      data: result,
    };
  }
}
