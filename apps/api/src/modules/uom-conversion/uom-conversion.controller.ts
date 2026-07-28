import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UomConversionService } from './uom-conversion.service';
import { CreateUomConversionDto, UpdateUomConversionDto } from './dto/uom-conversion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('UOM Conversion Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uom/conversion')
export class UomConversionController {
  constructor(private readonly svc: UomConversionService) {}

  @Post()
  @RequirePermission('MASTER', 'UOM_CONVERSION', 'create')
  @ApiOperation({ summary: 'Create UOM Conversion Factor (e.g. 1 BAG = 50 KG)' })
  async createConversion(@Body() dto: CreateUomConversionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.createConversion(dto, tenantId);
    return { success: true, message: 'UOM conversion created.', data: result };
  }

  @Get()
  @RequirePermission('MASTER', 'UOM_CONVERSION', 'view')
  @ApiOperation({ summary: 'List all active UOM Conversion Factors for tenant' })
  async listConversions(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.listConversions(tenantId);
    return { success: true, message: 'UOM conversions retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('MASTER', 'UOM_CONVERSION', 'edit')
  @ApiOperation({ summary: 'Update UOM Conversion Factor or Effective Date' })
  @ApiParam({ name: 'id', description: 'Conversion UUID' })
  async updateConversion(@Param('id') id: string, @Body() dto: UpdateUomConversionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.updateConversion(id, dto, tenantId);
    return { success: true, message: 'UOM conversion updated.', data: result };
  }

  @Delete(':id')
  @RequirePermission('MASTER', 'UOM_CONVERSION', 'delete')
  @ApiOperation({ summary: 'Deactivate UOM Conversion Factor' })
  @ApiParam({ name: 'id', description: 'Conversion UUID' })
  async deactivateConversion(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.deactivateConversion(id, tenantId);
    return { success: true, message: 'UOM conversion deactivated.', data: result };
  }
}
