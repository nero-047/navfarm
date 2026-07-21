import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../../common/guards/system-admin.guard';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';

@ApiTags('SaaS Subscription Plans')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscription plans configured in NAVFarm' })
  async findAll() {
    return this.planService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch single subscription plan details' })
  @ApiParam({ name: 'id', description: 'Plan string ID' })
  async findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new subscription plan' })
  async create(@Body() body: CreatePlanDto) {
    return this.planService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update subscription plan configurations' })
  @ApiParam({ name: 'id', description: 'Plan string ID' })
  async update(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    return this.planService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan string ID' })
  async remove(@Param('id') id: string) {
    return this.planService.remove(id);
  }
}
