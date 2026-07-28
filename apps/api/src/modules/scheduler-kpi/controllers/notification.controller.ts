import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiProperty } from '@nestjs/swagger';
import { NotificationDeliveryService } from '../services/notification-delivery.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class DispatchNotificationDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ example: 'Vaccination Reminder' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Batch BATCH-2026-01 is due for Gumboro vaccination today at 08:00 AM.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: 'IN_APP', default: 'IN_APP' })
  @IsString()
  @IsOptional()
  channel?: string;
}

@ApiTags('Scheduler, Alerts & KPI — Notification Dispatcher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/notification')
export class NotificationController {
  constructor(private readonly notifService: NotificationDeliveryService) {}

  @Post('dispatch')
  @RequirePermission('SCHEDULER', 'NOTIFICATION', 'create')
  @ApiOperation({ summary: 'Dispatch Multi-Channel Notification (In-App, Email, Push)' })
  async dispatchNotification(@Body() dto: DispatchNotificationDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.notifService.dispatchNotification(
      dto.company_id,
      dto.user_id || null,
      dto.title,
      dto.body,
      dto.channel || 'IN_APP',
      tenantId
    );
    return {
      success: true,
      message: 'Notification dispatched.',
      data: result,
    };
  }

  @Get('my-notifications')
  @RequirePermission('SCHEDULER', 'NOTIFICATION', 'view')
  @ApiOperation({ summary: 'Fetch logged-in user notifications' })
  async getUserNotifications(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const userId = req.user?.userId;
    const result = await this.notifService.getUserNotifications(userId, tenantId);
    return {
      success: true,
      message: 'Notifications retrieved.',
      data: result,
    };
  }

  @Post('read/:id')
  @RequirePermission('SCHEDULER', 'NOTIFICATION', 'edit')
  @ApiOperation({ summary: 'Mark Notification as Read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.notifService.markAsRead(id, tenantId);
    return {
      success: true,
      message: 'Notification marked as read.',
      data: result,
    };
  }
}
