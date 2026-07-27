import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InventoryAdjustmentService } from '../services/inventory-adjustment.service';
import { CreateInventoryAdjustmentDto, QueryInventoryAdjustmentDto } from '../dto/inventory-adjustment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Inventory Adjustment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/adjustment')
export class InventoryAdjustmentController {
  constructor(private readonly adjustmentService: InventoryAdjustmentService) {}

  @Post()
  @RequirePermission('INVENTORY', 'ADJUSTMENT', 'create')
  @ApiOperation({ summary: 'Register a new Inventory Adjustment draft' })
  async create(@Body() dto: CreateInventoryAdjustmentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.adjustmentService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory Adjustment registered as DRAFT.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'ADJUSTMENT', 'create')
  @ApiOperation({ summary: 'Post a draft Inventory Adjustment to stock ledger' })
  @ApiParam({ name: 'id', description: 'Inventory Adjustment UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.adjustmentService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory Adjustment posted successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'ADJUSTMENT', 'view')
  @ApiOperation({ summary: 'Fetch details of an Inventory Adjustment' })
  @ApiParam({ name: 'id', description: 'Inventory Adjustment UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.adjustmentService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Inventory Adjustment details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'ADJUSTMENT', 'view')
  @ApiOperation({ summary: 'List all Inventory Adjustments matching filters' })
  async findAll(@Query() query: QueryInventoryAdjustmentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.adjustmentService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Inventory Adjustments retrieved successfully.',
      data: result
    };
  }
}
