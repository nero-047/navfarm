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
import { GoodsReceiptService } from '../services/goods-receipt.service';
import { CreateGoodsReceiptDto, QueryGoodsReceiptDto } from '../dto/goods-receipt.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Goods Receipt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/goods-receipt')
export class GoodsReceiptController {
  constructor(private readonly receiptService: GoodsReceiptService) {}

  @Post()
  @RequirePermission('INVENTORY', 'GOODS_RECEIPT', 'create')
  @ApiOperation({ summary: 'Register a new Goods Receipt draft' })
  async create(@Body() dto: CreateGoodsReceiptDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.receiptService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Goods Receipt registered as DRAFT.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'GOODS_RECEIPT', 'create')
  @ApiOperation({ summary: 'Post a draft Goods Receipt to ledger entries' })
  @ApiParam({ name: 'id', description: 'Goods Receipt UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.receiptService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Goods Receipt posted to stock ledger.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'GOODS_RECEIPT', 'view')
  @ApiOperation({ summary: 'Fetch details of a Goods Receipt' })
  @ApiParam({ name: 'id', description: 'Goods Receipt UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.receiptService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Goods Receipt details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'GOODS_RECEIPT', 'view')
  @ApiOperation({ summary: 'List all Goods Receipts matching filters' })
  async findAll(@Query() query: QueryGoodsReceiptDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.receiptService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Goods Receipts retrieved successfully.',
      data: result
    };
  }
}
