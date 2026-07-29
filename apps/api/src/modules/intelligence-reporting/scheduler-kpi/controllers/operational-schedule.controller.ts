import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OperationalScheduleService } from '../services/operational-schedule.service';
import { CreateVaccinationScheduleDto, CreateFeedScheduleDto } from '../dto/operational-schedule.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Scheduler, Alerts & KPI — Operational Schedules (Vaccination & Feed)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/operational')
export class OperationalScheduleController {
  constructor(private readonly opService: OperationalScheduleService) {}

  @Post('vaccination')
  @RequirePermission('SCHEDULER', 'VACCINATION', 'create')
  @ApiOperation({ summary: 'Schedule Vaccination Calendar Event' })
  async createVaccinationSchedule(@Body() dto: CreateVaccinationScheduleDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.opService.createVaccinationSchedule(dto, tenantId);
    return {
      success: true,
      message: 'Vaccination schedule created.',
      data: result,
    };
  }

  @Post('vaccination/complete/:id')
  @RequirePermission('SCHEDULER', 'VACCINATION', 'edit')
  @ApiOperation({ summary: 'Mark Vaccination Calendar Event as Completed' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async completeVaccination(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.opService.completeVaccination(id, tenantId);
    return {
      success: true,
      message: 'Vaccination completed.',
      data: result,
    };
  }

  @Get('vaccination')
  @RequirePermission('SCHEDULER', 'VACCINATION', 'view')
  @ApiOperation({ summary: 'List Vaccination Schedules for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getVaccinationSchedules(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.opService.getVaccinationSchedules(companyId, tenantId);
    return {
      success: true,
      message: 'Vaccination schedules retrieved.',
      data: result,
    };
  }

  @Post('feed')
  @RequirePermission('SCHEDULER', 'FEED', 'create')
  @ApiOperation({ summary: 'Schedule Daily Feeding Dispatch Plan' })
  async createFeedSchedule(@Body() dto: CreateFeedScheduleDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.opService.createFeedSchedule(dto, tenantId);
    return {
      success: true,
      message: 'Feed schedule created.',
      data: result,
    };
  }

  @Get('feed')
  @RequirePermission('SCHEDULER', 'FEED', 'view')
  @ApiOperation({ summary: 'List Feed Schedules for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getFeedSchedules(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.opService.getFeedSchedules(companyId, tenantId);
    return {
      success: true,
      message: 'Feed schedules retrieved.',
      data: result,
    };
  }
}
