import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards, 
  Patch 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto, QueryWarehouseDto } from './dto/warehouse.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Warehouse Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'create')
  @ApiOperation({ summary: 'Register a new Warehouse' })
  async create(@Body() dto: CreateWarehouseDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'Warehouse registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'view')
  @ApiOperation({ summary: 'List all Warehouses matching filters' })
  async findAll(@Query() query: QueryWarehouseDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Warehouses retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'view')
  @ApiOperation({ summary: 'Fetch details of a single Warehouse by UUID' })
  @ApiParam({ name: 'id', description: 'Warehouse UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.warehouseService.findOne(id);
    return {
      success: true,
      message: 'Warehouse details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'edit')
  @ApiOperation({ summary: 'Update details of an existing Warehouse' })
  @ApiParam({ name: 'id', description: 'Warehouse UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'Warehouse updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a Warehouse profile' })
  @ApiParam({ name: 'id', description: 'Warehouse UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.remove(id, tenantId, req.user);
    return {
      ...result,
      success: true,
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'WAREHOUSE', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted Warehouse profile' })
  @ApiParam({ name: 'id', description: 'Warehouse UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.warehouseService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'Warehouse restored successfully.',
      data: result
    };
  }
}
