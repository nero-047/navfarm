import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SchedulerEngineService } from '../services/scheduler-engine.service';
import { CreateSchedulerJobDto } from '../dto/scheduler.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Scheduler, Alerts & KPI — Scheduler Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/job')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerEngineService) {}

  @Post()
  @RequirePermission('SCHEDULER', 'JOB', 'create')
  @ApiOperation({ summary: 'Create Enterprise Scheduled Recurrence Job' })
  async createJob(@Body() dto: CreateSchedulerJobDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.createJob(dto, tenantId);
    return {
      success: true,
      message: 'Scheduler job created.',
      data: result,
    };
  }

  @Post('execute/:id')
  @RequirePermission('SCHEDULER', 'JOB', 'edit')
  @ApiOperation({ summary: 'Execute Scheduled Job on demand & record history log' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async executeJob(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.executeJob(id, tenantId);
    return {
      success: true,
      message: `Scheduled job execution status: ${result.status}.`,
      data: result,
    };
  }

  @Get()
  @RequirePermission('SCHEDULER', 'JOB', 'view')
  @ApiOperation({ summary: 'List Scheduled Jobs for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getJobs(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.schedulerService.getJobs(companyId, tenantId);
    return {
      success: true,
      message: 'Scheduled jobs retrieved.',
      data: result,
    };
  }

  @Get('history/:id')
  @RequirePermission('SCHEDULER', 'JOB', 'view')
  @ApiOperation({ summary: 'Fetch execution history for a scheduled job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  async getJobHistory(@Param('id') id: string) {
    const result = await this.schedulerService.getJobHistory(id);
    return {
      success: true,
      message: 'Job execution history retrieved.',
      data: result,
    };
  }
}
