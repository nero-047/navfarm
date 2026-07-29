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
import { TransferOrderService } from '../services/transfer-order.service';
import { CreateTransferOrderDto, QueryTransferOrderDto } from '../dto/transfer-order.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Transfer Order')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/transfer-order')
export class TransferOrderController {
  constructor(private readonly transferService: TransferOrderService) {}

  @Post()
  @RequirePermission('INVENTORY', 'TRANSFER_ORDER', 'create')
  @ApiOperation({ summary: 'Register a new Warehouse Transfer Order draft' })
  async create(@Body() dto: CreateTransferOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.transferService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Transfer Order registered as DRAFT.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'TRANSFER_ORDER', 'create')
  @ApiOperation({ summary: 'Post a draft Transfer Order to execute multi-warehouse stock movement' })
  @ApiParam({ name: 'id', description: 'Transfer Order UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.transferService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Transfer Order posted to stock ledger.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'TRANSFER_ORDER', 'view')
  @ApiOperation({ summary: 'Fetch details of a Transfer Order' })
  @ApiParam({ name: 'id', description: 'Transfer Order UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.transferService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Transfer Order details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'TRANSFER_ORDER', 'view')
  @ApiOperation({ summary: 'List all Transfer Orders matching filters' })
  async findAll(@Query() query: QueryTransferOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.transferService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Transfer Orders retrieved successfully.',
      data: result
    };
  }
}
