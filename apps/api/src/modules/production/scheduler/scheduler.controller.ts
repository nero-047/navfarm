import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { CreateSchedulerDto, UpdateSchedulerDto, QuerySchedulerDto } from './dto/scheduler.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Production Schedulers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  @RequirePermission('PRODUCTION', 'SCHEDULER', 'create')
  @ApiOperation({ summary: 'Create a Scheduler template with period-wise parameter lines' })
  async create(@Body() dto: CreateSchedulerDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.create(dto, tenantId, req.user);
    return { success: true, message: 'Scheduler created successfully.', data: result };
  }

  @Get()
  @RequirePermission('PRODUCTION', 'SCHEDULER', 'view')
  @ApiOperation({ summary: 'List Schedulers matching filters' })
  async findAll(@Query() query: QuerySchedulerDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.findAll(query, tenantId);
    return { success: true, message: 'Schedulers retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'SCHEDULER', 'view')
  @ApiOperation({ summary: 'Fetch a Scheduler with its parameter lines' })
  @ApiParam({ name: 'id', description: 'Scheduler UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.schedulerService.findOne(id);
    return { success: true, message: 'Scheduler retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('PRODUCTION', 'SCHEDULER', 'edit')
  @ApiOperation({ summary: 'Update a Scheduler (rejected once locked by an ACTIVE batch)' })
  @ApiParam({ name: 'id', description: 'Scheduler UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateSchedulerDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.update(id, dto, tenantId, req.user);
    return { success: true, message: 'Scheduler updated successfully.', data: result };
  }

  @Delete(':id')
  @RequirePermission('PRODUCTION', 'SCHEDULER', 'delete')
  @ApiOperation({ summary: 'Deactivate a Scheduler' })
  @ApiParam({ name: 'id', description: 'Scheduler UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.schedulerService.remove(id, tenantId, req.user);
  }
}
