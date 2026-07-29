import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QcService } from './qc.service';
import { CreateQcTemplateDto, RecordQcInspectionDto, ReleaseQuarantineDto } from './dto/qc.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality Control & Quarantine Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc')
export class QcController {
  constructor(private readonly qcService: QcService) {}

  @Post('template')
  @RequirePermission('QC', 'TEMPLATE', 'create')
  @ApiOperation({ summary: 'Create Quality Control Parameter Template' })
  async createTemplate(@Body() dto: CreateQcTemplateDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcService.createTemplate(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'QC parameter template created.',
      data: result,
    };
  }

  @Post('inspection')
  @RequirePermission('QC', 'INSPECTION', 'create')
  @ApiOperation({ summary: 'Record QC Inspection & Auto-Quarantine Hold on failure' })
  async recordInspection(@Body() dto: RecordQcInspectionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcService.recordInspection(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'QC inspection recorded.',
      data: result,
    };
  }

  @Post('quarantine/release')
  @RequirePermission('QC', 'QUARANTINE', 'edit')
  @ApiOperation({ summary: 'Release or Reject Quarantine Hold' })
  async releaseQuarantine(@Body() dto: ReleaseQuarantineDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcService.releaseQuarantine(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: `Quarantine hold status updated to ${result.status}.`,
      data: result,
    };
  }

  @Get('templates')
  @RequirePermission('QC', 'TEMPLATE', 'view')
  @ApiOperation({ summary: 'List QC Parameter Templates' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getTemplates(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcService.getTemplates(companyId, tenantId);
    return {
      success: true,
      message: 'QC templates retrieved.',
      data: result,
    };
  }

  @Get('quarantine')
  @RequirePermission('QC', 'QUARANTINE', 'view')
  @ApiOperation({ summary: 'List Quarantine Holds' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getQuarantineHolds(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcService.getQuarantineHolds(companyId, tenantId);
    return {
      success: true,
      message: 'Quarantine holds retrieved.',
      data: result,
    };
  }
}
