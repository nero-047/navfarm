import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductionOrderService } from '../services/production-order.service';
import { CreateProductionOrderDto, UpdateProductionOrderDto } from '../dto/production-order.dto';
import { QueryProductionDto } from '../dto/query-production.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Production Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production/order')
export class ProductionOrderController {
  constructor(private readonly orderService: ProductionOrderService) {}

  @Post()
  @RequirePermission('PRODUCTION', 'ORDER', 'create')
  @ApiOperation({ summary: 'Create a new Production Order draft' })
  async createOrder(@Body() dto: CreateProductionOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.orderService.createOrder(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Production Order created.',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'ORDER', 'view')
  @ApiOperation({ summary: 'Fetch single Production Order details' })
  @ApiParam({ name: 'id', description: 'Production Order UUID' })
  async findOrderById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.orderService.findOrderById(id, tenantId);
    return {
      success: true,
      message: 'Production Order details retrieved.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('PRODUCTION', 'ORDER', 'view')
  @ApiOperation({ summary: 'List all Production Orders matching filters' })
  async findAllOrders(@Query() query: QueryProductionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.orderService.findAllOrders(query, tenantId);
    return {
      success: true,
      message: 'Production Orders retrieved.',
      data: result,
    };
  }

  @Put(':id')
  @RequirePermission('PRODUCTION', 'ORDER', 'edit')
  @ApiOperation({ summary: 'Update an existing Production Order' })
  @ApiParam({ name: 'id', description: 'Production Order UUID' })
  async updateOrder(@Param('id') id: string, @Body() dto: UpdateProductionOrderDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.orderService.updateOrder(id, dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Production Order updated.',
      data: result,
    };
  }
}
