import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ParameterMasterService } from './parameter-master.service';
import { CreateParameterDto, BatchParameterEntryDto } from './dto/parameter-master.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Parameter Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parameter')
export class ParameterMasterController {
  constructor(private readonly svc: ParameterMasterService) {}

  @Post()
  @RequirePermission('SETUP', 'PARAMETER', 'create')
  @ApiOperation({ summary: 'Define a reusable parameter (CONS_FEED, MORT_M, DESC_WEIGHT, PROD_MILK etc.)' })
  async createParameter(@Body() dto: CreateParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.createParameter(dto, tenantId) };
  }

  @Get()
  @RequirePermission('SETUP', 'PARAMETER', 'view')
  @ApiOperation({ summary: 'List all active parameters' })
  async listParameters(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.listParameters(tenantId) };
  }

  @Post('batch/:batchId/entry')
  @RequirePermission('PRODUCTION', 'PARAMETER_ENTRY', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Submit daily data entry against a parameter for any batch' })
  async submitEntry(@Param('batchId') batchId: string, @Body() dto: BatchParameterEntryDto, @Req() req: any) {
    return { success: true, data: await this.svc.submitBatchEntry(batchId, dto, req.user?.userId) };
  }

  @Get('batch/:batchId/entries')
  @RequirePermission('PRODUCTION', 'PARAMETER_ENTRY', 'view')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Get all parameter entries for a batch' })
  async getBatchEntries(@Param('batchId') batchId: string) {
    return { success: true, data: await this.svc.getBatchEntries(batchId) };
  }
}
