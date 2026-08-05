import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CreateNotificationConfigDto, UpdateNotificationConfigDto, SendTestNotificationDto, QueryNotificationConfigDto } from './dto/notification.dto';

@ApiTags('Notification Engine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'create')
  @ApiOperation({ summary: 'Configure a notification channel for a company' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification channel config created.' })
  async create(@Body() body: CreateNotificationConfigDto) {
    return this.notificationService.create(body);
  }

  @Get('company/:companyId')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'view')
  @ApiOperation({ summary: 'List all notification channel configurations for a company' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async findByCompany(@Param('companyId') companyId: string) {
    return this.notificationService.findByCompany(companyId);
  }

  @Get('logs/:companyId')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'view')
  @ApiOperation({ summary: 'Fetch notification audit logs for a company' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async getLogs(@Param('companyId') companyId: string) {
    return this.notificationService.getLogs(companyId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'view')
  @ApiOperation({ summary: 'Fetch a single notification channel configuration' })
  @ApiParam({ name: 'id', description: 'Notification config UUID' })
  async findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'edit')
  @ApiOperation({ summary: 'Update a notification channel configuration' })
  @ApiParam({ name: 'id', description: 'Notification config UUID' })
  async update(@Param('id') id: string, @Body() body: UpdateNotificationConfigDto) {
    return this.notificationService.update(id, body);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'delete')
  @ApiOperation({ summary: 'Delete a notification channel configuration' })
  @ApiParam({ name: 'id', description: 'Notification config UUID' })
  async remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }

  @Post('test')
  @ApiBearerAuth()
  @RequirePermission('NOTIFICATION', 'SETTINGS', 'edit')
  @ApiOperation({ summary: 'Send a test notification through a configured channel' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Test notification sent.' })
  async sendTest(@Body() body: SendTestNotificationDto) {
    return this.notificationService.sendTest(body.configId, body.recipient, body.message);
  }
}
