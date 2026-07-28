import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QualityInspectionService } from '../services/quality-inspection.service';
import { ExecuteQualityInspectionDto } from '../dto/quality-inspection.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Inspection Execution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/inspection')
export class QualityInspectionController {
  constructor(private readonly inspectionService: QualityInspectionService) {}

  @Post('execute')
  @RequirePermission('QUALITY', 'INSPECTION', 'create')
  @ApiOperation({ summary: 'Execute Quality Inspection & evaluate parameter pass/fail criteria' })
  async executeInspection(@Body() dto: ExecuteQualityInspectionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.inspectionService.executeInspection(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: `Quality inspection executed. Result: ${result.overall_result}.`,
      data: result,
    };
  }

  @Get(':id')
  @RequirePermission('QUALITY', 'INSPECTION', 'view')
  @ApiOperation({ summary: 'Fetch Quality Inspection details with parameter results' })
  @ApiParam({ name: 'id', description: 'Inspection UUID' })
  async getInspectionById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.inspectionService.getInspectionById(id, tenantId);
    return {
      success: true,
      message: 'Quality inspection details retrieved.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('QUALITY', 'INSPECTION', 'view')
  @ApiOperation({ summary: 'List Quality Inspections for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getInspections(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.inspectionService.getInspections(companyId, tenantId);
    return {
      success: true,
      message: 'Quality inspections retrieved.',
      data: result,
    };
  }
}
