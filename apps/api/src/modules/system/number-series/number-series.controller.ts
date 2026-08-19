import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NumberSeriesService } from './number-series.service';
import { CreateNumberSeriesDto, UpdateNumberSeriesDto, QueryNumberSeriesDto } from './dto/number-series.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Number Series')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('number-series')
export class NumberSeriesController {
  constructor(private readonly numberSeriesService: NumberSeriesService) {}

  @Post()
  @RequirePermission('SYSTEM', 'NUMBER_SERIES', 'create')
  @ApiOperation({ summary: 'Create a business-code Number Series (e.g. "BATCH" -> BATCH-000001)' })
  async create(@Body() dto: CreateNumberSeriesDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.numberSeriesService.create(dto, tenantId, req.user);
    return { success: true, message: 'Number series created successfully.', data: result };
  }

  @Get()
  @RequirePermission('SYSTEM', 'NUMBER_SERIES', 'view')
  @ApiOperation({ summary: 'List Number Series matching filters' })
  async findAll(@Query() query: QueryNumberSeriesDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.numberSeriesService.findAll(query, tenantId);
    return { success: true, message: 'Number series retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('SYSTEM', 'NUMBER_SERIES', 'view')
  @ApiOperation({ summary: 'Fetch a single Number Series' })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.numberSeriesService.findOne(id);
    return { success: true, message: 'Number series retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('SYSTEM', 'NUMBER_SERIES', 'edit')
  @ApiOperation({ summary: 'Update a Number Series' })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateNumberSeriesDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.numberSeriesService.update(id, dto, tenantId, req.user);
    return { success: true, message: 'Number series updated successfully.', data: result };
  }

  @Delete(':id')
  @RequirePermission('SYSTEM', 'NUMBER_SERIES', 'delete')
  @ApiOperation({ summary: 'Deactivate a Number Series' })
  @ApiParam({ name: 'id', description: 'Series UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.numberSeriesService.remove(id, tenantId, req.user);
  }
}
