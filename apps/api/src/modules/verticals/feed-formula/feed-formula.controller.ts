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
import { FeedFormulaService } from './feed-formula.service';
import { CreateFeedFormulaDto, UpdateFeedFormulaDto, QueryFeedFormulaDto } from './dto/feed-formula.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Feed Formula (BOM) Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feed-formula')
export class FeedFormulaController {
  constructor(private readonly feedFormulaService: FeedFormulaService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'create')
  @ApiOperation({ summary: 'Register a new Feed Formula / BOM' })
  async create(@Body() dto: CreateFeedFormulaDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'Feed Formula registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'view')
  @ApiOperation({ summary: 'List all Feed Formulas matching filters' })
  async findAll(@Query() query: QueryFeedFormulaDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Feed Formulas retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'view')
  @ApiOperation({ summary: 'Fetch details of a single Feed Formula by UUID (including ingredients)' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.feedFormulaService.findOne(id);
    return {
      success: true,
      message: 'Feed Formula details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'edit')
  @ApiOperation({ summary: 'Update header details of an existing Feed Formula' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateFeedFormulaDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'Feed Formula updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a Feed Formula and its ingredients' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.remove(id, tenantId, req.user);
    return {
      success: true,
      ...result
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted Feed Formula and its ingredients' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'Feed Formula restored successfully.',
      data: result
    };
  }

  @Post(':id/ingredients')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'edit')
  @ApiOperation({ summary: 'Add a new BOR ingredient line to a feed formula' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async addIngredient(@Param('id') id: string, @Body() dto: { item_id: string; inclusion_pct: number; quantity_kg?: number; is_critical?: boolean }, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.addIngredientLine(id, dto, tenantId, req.user);
    return { success: true, message: 'Ingredient line added to formula.', data: result };
  }

  @Delete('ingredients/:ingredientId')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'edit')
  @ApiOperation({ summary: 'Remove a BOR ingredient line from a feed formula' })
  @ApiParam({ name: 'ingredientId', description: 'Ingredient Line UUID' })
  async removeIngredient(@Param('ingredientId') ingredientId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.removeIngredientLine(ingredientId, tenantId, req.user);
    return { success: true, ...result };
  }

  @Post(':id/version')
  @RequirePermission('MASTER_DATA', 'FEED_FORMULA', 'create')
  @ApiOperation({ summary: 'Create a new versioned revision of a feed formula' })
  @ApiParam({ name: 'id', description: 'Formula UUID' })
  async createVersion(@Param('id') id: string, @Body() dto: { version_name: string; remarks?: string }, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.feedFormulaService.createFormulaVersion(id, dto, tenantId, req.user);
    return { success: true, message: 'Formula version created.', data: result };
  }
}
