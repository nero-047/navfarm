import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ParameterService } from './parameter.service';
import { CreateParameterDto, UpdateParameterDto, QueryParameterDto } from './dto/parameter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Production Parameters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parameter')
export class ParameterController {
  constructor(private readonly parameterService: ParameterService) {}

  @Post()
  @RequirePermission('PRODUCTION', 'PARAMETER', 'create')
  @ApiOperation({ summary: 'Create a reusable Parameter (e.g. "Starter Feed Consumption")' })
  async create(@Body() dto: CreateParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.parameterService.create(dto, tenantId, req.user);
    return { success: true, message: 'Parameter created successfully.', data: result };
  }

  @Get()
  @RequirePermission('PRODUCTION', 'PARAMETER', 'view')
  @ApiOperation({ summary: 'List Parameters matching filters' })
  async findAll(@Query() query: QueryParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.parameterService.findAll(query, tenantId);
    return { success: true, message: 'Parameters retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'PARAMETER', 'view')
  @ApiOperation({ summary: 'Fetch a single Parameter' })
  @ApiParam({ name: 'id', description: 'Parameter UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.parameterService.findOne(id);
    return { success: true, message: 'Parameter retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('PRODUCTION', 'PARAMETER', 'edit')
  @ApiOperation({ summary: 'Update a Parameter' })
  @ApiParam({ name: 'id', description: 'Parameter UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateParameterDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.parameterService.update(id, dto, tenantId, req.user);
    return { success: true, message: 'Parameter updated successfully.', data: result };
  }

  @Delete(':id')
  @RequirePermission('PRODUCTION', 'PARAMETER', 'delete')
  @ApiOperation({ summary: 'Deactivate a Parameter' })
  @ApiParam({ name: 'id', description: 'Parameter UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.parameterService.remove(id, tenantId, req.user);
  }
}
