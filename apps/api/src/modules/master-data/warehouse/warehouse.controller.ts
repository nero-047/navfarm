import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { QueryWarehouseDto } from './dto/warehouse.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

/**
 * Read-only. Warehouses are rows of `location_master`, so they are created,
 * renamed and retired through /location — the single write path for the whole
 * location tree. These endpoints remain because existing screens bind to the
 * warehouse_* field names; they project the location rows back into that shape.
 */
@ApiTags('Warehouse Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'view')
  @ApiOperation({ summary: 'List all Warehouses matching filters' })
  async findAll(@Query() query: QueryWarehouseDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.findAll(query, tenantId);
    return { success: true, message: 'Warehouses retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'view')
  @ApiOperation({ summary: 'Get a single Warehouse by ID' })
  @ApiParam({ name: 'id', description: 'Warehouse UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.warehouseService.findOne(id);
    return { success: true, message: 'Warehouse retrieved successfully.', data: result };
  }
}
