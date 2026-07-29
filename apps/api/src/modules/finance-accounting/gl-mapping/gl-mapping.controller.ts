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
import { GlMappingService } from './gl-mapping.service';
import { CreateGlMappingDto, UpdateGlMappingDto, QueryGlMappingDto } from './dto/gl-mapping.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('G/L Account Mapping Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gl-mapping')
export class GlMappingController {
  constructor(private readonly glMappingService: GlMappingService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'create')
  @ApiOperation({ summary: 'Register a new G/L Mapping rule' })
  async create(@Body() dto: CreateGlMappingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'G/L Mapping rule registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'view')
  @ApiOperation({ summary: 'List all G/L Mapping rules matching filters' })
  async findAll(@Query() query: QueryGlMappingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.findAll(query, tenantId);
    return {
      success: true,
      message: 'G/L Mapping rules retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'view')
  @ApiOperation({ summary: 'Fetch details of a single G/L Mapping rule by UUID' })
  @ApiParam({ name: 'id', description: 'G/L Mapping rule UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.glMappingService.findOne(id);
    return {
      success: true,
      message: 'G/L Mapping rule details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'edit')
  @ApiOperation({ summary: 'Update details of an existing G/L Mapping rule' })
  @ApiParam({ name: 'id', description: 'G/L Mapping rule UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateGlMappingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'G/L Mapping rule updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a G/L Mapping rule' })
  @ApiParam({ name: 'id', description: 'G/L Mapping rule UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.remove(id, tenantId, req.user);
    return {
      success: true,
      ...result
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted G/L Mapping rule' })
  @ApiParam({ name: 'id', description: 'G/L Mapping rule UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'G/L Mapping rule restored successfully.',
      data: result
    };
  }

  @Post('seed-v2-defaults')
  @RequirePermission('MASTER_DATA', 'GL_MAPPING', 'create')
  @ApiOperation({ summary: 'Seed default G/L mapping rules for V2 transaction types (AQUA_HARVEST, FEED_MO_OUTPUT, CROP_HARVEST, LIVESTOCK_SALE)' })
  async seedV2Defaults(@Body('company_id') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.glMappingService.seedV2DefaultMappings(companyId, tenantId, req.user);
    return {
      success: true,
      message: `Seeded ${result.seededCount} default V2 G/L mapping rules.`,
      data: result
    };
  }
}
