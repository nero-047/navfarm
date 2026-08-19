import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TimezoneService } from './timezone.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../../../common/guards/system-admin.guard';
import { CreateTimezoneDto, UpdateTimezoneDto } from './dto/timezone.dto';

@ApiTags('Timezone Master')
@Controller('timezone')
export class TimezoneController {
  constructor(private readonly timezoneService: TimezoneService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all active timezones' })
  async listTimezones() {
    return this.timezoneService.listTimezones();
  }

  @Post()
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new supported timezone' })
  async createTimezone(@Body() body: CreateTimezoneDto) {
    return this.timezoneService.createTimezone(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update timezone details' })
  @ApiParam({ name: 'id', description: 'Timezone UUID' })
  async updateTimezone(@Param('id') id: string, @Body() body: UpdateTimezoneDto) {
    return this.timezoneService.updateTimezone(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a timezone' })
  @ApiParam({ name: 'id', description: 'Timezone UUID' })
  async deleteTimezone(@Param('id') id: string) {
    return this.timezoneService.deleteTimezone(id);
  }
}
