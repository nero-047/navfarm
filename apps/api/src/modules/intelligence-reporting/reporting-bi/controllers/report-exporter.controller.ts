import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportExporterService } from '../services/report-exporter.service';
import { ExportReportDto } from '../dto/report-query.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Multi-Format Exporter')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/export')
export class ReportExporterController {
  constructor(private readonly exporterService: ReportExporterService) {}

  @Post()
  @RequirePermission('REPORTING', 'EXPORT', 'create')
  @ApiOperation({ summary: 'Export Analytical Report into PDF, XLSX (Excel), or CSV format' })
  async exportReport(@Body() dto: ExportReportDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.exporterService.exportReport(
      dto.company_id,
      dto.report_id,
      dto.export_format,
      tenantId,
      req.user?.userId
    );
    return {
      success: true,
      message: `Report exported cleanly as ${dto.export_format}. Download link generated.`,
      data: result,
    };
  }
}
