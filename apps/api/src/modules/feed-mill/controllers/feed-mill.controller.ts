import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FeedMillService } from '../services/feed-mill.service';
import {
  CreateBorDto, AddBorIngredientDto, SetBorNutritionDto,
  CreateFeedProductionBatchDto, RecordFeedProductionInputDto, CloseFeedProductionBatchDto
} from '../dto/feed-mill.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Feed Mill — Bill of Recipe (BOR)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feed-mill')
export class FeedMillController {
  constructor(private readonly svc: FeedMillService) {}

  // ---- BOR ----
  @Post('bor')
  @RequirePermission('FEED_MILL', 'BOR', 'create')
  @ApiOperation({ summary: 'Create Bill of Recipe (versioned). e.g. BOR-2025-001-V1' })
  async createBor(@Body() dto: CreateBorDto, @Req() req: any) {
    return { success: true, data: await this.svc.createBor(dto, req.user?.tenantId, req.user?.companyId) };
  }

  @Get('bor')
  @RequirePermission('FEED_MILL', 'BOR', 'view')
  @ApiOperation({ summary: 'List all active Bills of Recipe for tenant' })
  async listBors(@Req() req: any) {
    return { success: true, data: await this.svc.listBors(req.user?.tenantId) };
  }

  @Get('bor/:borId')
  @RequirePermission('FEED_MILL', 'BOR', 'view')
  @ApiParam({ name: 'borId' })
  @ApiOperation({ summary: 'Get BOR details by ID' })
  async getBor(@Param('borId') borId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getBor(borId, req.user?.tenantId) };
  }

  @Post('bor/:borId/ingredient')
  @RequirePermission('FEED_MILL', 'BOR', 'edit')
  @ApiParam({ name: 'borId' })
  @ApiOperation({ summary: 'Add ingredient line to BOR (e.g. Maize 52%, Soybean Meal 30%)' })
  async addIngredient(@Param('borId') borId: string, @Body() dto: AddBorIngredientDto) {
    return { success: true, data: await this.svc.addIngredient(borId, dto) };
  }

  @Get('bor/:borId/ingredients')
  @RequirePermission('FEED_MILL', 'BOR', 'view')
  @ApiParam({ name: 'borId' })
  @ApiOperation({ summary: 'Get all ingredient lines for a BOR' })
  async getBorIngredients(@Param('borId') borId: string) {
    return { success: true, data: await this.svc.getBorIngredients(borId) };
  }

  @Post('bor/:borId/nutrition')
  @RequirePermission('FEED_MILL', 'BOR', 'edit')
  @ApiParam({ name: 'borId' })
  @ApiOperation({ summary: 'Set nutritional profile for BOR (protein%, moisture%, ME kcal/kg)' })
  async upsertNutrition(@Param('borId') borId: string, @Body() dto: SetBorNutritionDto) {
    return { success: true, data: await this.svc.upsertNutrition(borId, dto) };
  }

  @Get('bor/:borId/nutrition')
  @RequirePermission('FEED_MILL', 'BOR', 'view')
  @ApiParam({ name: 'borId' })
  @ApiOperation({ summary: 'Get nutritional profile for a BOR' })
  async getNutrition(@Param('borId') borId: string) {
    return { success: true, data: await this.svc.getNutrition(borId) };
  }

  // ---- Feed Production Batch ----
  @Post('production-batch')
  @RequirePermission('FEED_MILL', 'PRODUCTION', 'create')
  @ApiOperation({ summary: 'Create feed production batch (attaches to a BOR version)' })
  async createProductionBatch(@Body() dto: CreateFeedProductionBatchDto, @Req() req: any) {
    return { success: true, data: await this.svc.createProductionBatch(dto, req.user?.tenantId, req.user?.companyId) };
  }

  @Get('production-batch')
  @RequirePermission('FEED_MILL', 'PRODUCTION', 'view')
  @ApiOperation({ summary: 'List all feed production batches' })
  async listProductionBatches(@Req() req: any) {
    return { success: true, data: await this.svc.listProductionBatches(req.user?.tenantId) };
  }

  @Get('production-batch/:fpBatchId')
  @RequirePermission('FEED_MILL', 'PRODUCTION', 'view')
  @ApiParam({ name: 'fpBatchId' })
  @ApiOperation({ summary: 'Get feed production batch by ID' })
  async getProductionBatch(@Param('fpBatchId') fpBatchId: string) {
    return { success: true, data: await this.svc.getProductionBatch(fpBatchId) };
  }

  @Post('production-batch/:fpBatchId/input')
  @RequirePermission('FEED_MILL', 'PRODUCTION', 'edit')
  @ApiParam({ name: 'fpBatchId' })
  @ApiOperation({ summary: 'Record actual ingredient usage for a feed production batch' })
  async recordInput(@Param('fpBatchId') fpBatchId: string, @Body() dto: RecordFeedProductionInputDto) {
    return { success: true, data: await this.svc.recordInput(fpBatchId, dto) };
  }

  @Post('production-batch/:fpBatchId/close')
  @RequirePermission('FEED_MILL', 'PRODUCTION', 'edit')
  @ApiParam({ name: 'fpBatchId' })
  @ApiOperation({ summary: 'Close feed production batch — calculates unit cost + usage variance vs BOR standard' })
  async closeProductionBatch(@Param('fpBatchId') fpBatchId: string, @Body() dto: CloseFeedProductionBatchDto) {
    return { success: true, data: await this.svc.closeProductionBatch(fpBatchId, dto) };
  }
}
