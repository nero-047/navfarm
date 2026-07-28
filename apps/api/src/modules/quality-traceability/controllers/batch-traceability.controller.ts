import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BatchTraceabilityService } from '../services/batch-traceability.service';
import { RecordTraceabilityEventDto } from '../dto/traceability.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Batch & Lot Lineage Traceability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/traceability')
export class BatchTraceabilityController {
  constructor(private readonly traceService: BatchTraceabilityService) {}

  @Post('event')
  @RequirePermission('QUALITY', 'TRACEABILITY', 'create')
  @ApiOperation({ summary: 'Record supply chain traceability event step' })
  async recordTraceabilityEvent(@Body() dto: RecordTraceabilityEventDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.traceService.recordTraceabilityEvent(dto, tenantId);
    return {
      success: true,
      message: 'Traceability movement event logged.',
      data: result,
    };
  }

  @Get('genealogy/:batchId')
  @RequirePermission('QUALITY', 'TRACEABILITY', 'view')
  @ApiOperation({ summary: 'Fetch full forward & backward batch genealogy lineage' })
  @ApiParam({ name: 'batchId', description: 'Production Batch UUID' })
  async getBatchGenealogy(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.traceService.getBatchGenealogy(batchId, tenantId);
    return {
      success: true,
      message: 'Batch genealogy lineage retrieved.',
      data: result,
    };
  }
}
