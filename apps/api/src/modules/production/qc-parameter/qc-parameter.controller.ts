import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QcParameterService } from './qc-parameter.service';
import { CreateQcParameterDto, UpdateQcParameterDto, QueryQcParameterDto } from './dto/qc-parameter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('QC Parameters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc-parameter')
export class QcParameterController {
  constructor(private readonly qcParameterService: QcParameterService) {}

  @Post()
  @RequirePermission('PRODUCTION', 'QC_PARAMETER', 'create')
  @ApiOperation({ summary: 'Create a QC Parameter (e.g. "Live Bird Weight at Slaughter")' })
  async create(@Body() dto: CreateQcParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcParameterService.create(dto, tenantId, req.user);
    return { success: true, message: 'QC parameter created successfully.', data: result };
  }

  @Get()
  @RequirePermission('PRODUCTION', 'QC_PARAMETER', 'view')
  @ApiOperation({ summary: 'List QC Parameters matching filters' })
  async findAll(@Query() query: QueryQcParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcParameterService.findAll(query, tenantId);
    return { success: true, message: 'QC parameters retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'QC_PARAMETER', 'view')
  @ApiOperation({ summary: 'Fetch a single QC Parameter' })
  @ApiParam({ name: 'id', description: 'QC Parameter UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.qcParameterService.findOne(id);
    return { success: true, message: 'QC parameter retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('PRODUCTION', 'QC_PARAMETER', 'edit')
  @ApiOperation({ summary: 'Update a QC Parameter' })
  @ApiParam({ name: 'id', description: 'QC Parameter UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateQcParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.qcParameterService.update(id, dto, tenantId, req.user);
    return { success: true, message: 'QC parameter updated successfully.', data: result };
  }

  @Delete(':id')
  @RequirePermission('PRODUCTION', 'QC_PARAMETER', 'delete')
  @ApiOperation({ summary: 'Deactivate a QC Parameter' })
  @ApiParam({ name: 'id', description: 'QC Parameter UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.qcParameterService.remove(id, tenantId, req.user);
  }
}
