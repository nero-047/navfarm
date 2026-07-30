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
import { FarmService } from './farm.service';
import { CreateFarmDto, UpdateFarmDto, QueryFarmDto } from './dto/farm.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Farm Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('farm')
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'FARM', 'create')
  @ApiOperation({ summary: 'Register a new Farm' })
  async create(@Body() dto: CreateFarmDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.farmService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'Farm registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'FARM', 'view')
  @ApiOperation({ summary: 'List all Farms matching filters' })
  async findAll(@Query() query: QueryFarmDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.farmService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Farms retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'FARM', 'view')
  @ApiOperation({ summary: 'Fetch details of a single Farm by UUID' })
  @ApiParam({ name: 'id', description: 'Farm UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.farmService.findOne(id);
    return {
      success: true,
      message: 'Farm details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'FARM', 'edit')
  @ApiOperation({ summary: 'Update details of an existing Farm' })
  @ApiParam({ name: 'id', description: 'Farm UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateFarmDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.farmService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'Farm updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'FARM', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a Farm profile' })
  @ApiParam({ name: 'id', description: 'Farm UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.farmService.remove(id, tenantId, req.user);
    return {
      ...result,
      success: true,
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'FARM', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted Farm profile' })
  @ApiParam({ name: 'id', description: 'Farm UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.farmService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'Farm restored successfully.',
      data: result
    };
  }
}
