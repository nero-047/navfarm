import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CostingProfileService } from '../services/costing-profile.service';
import { CreateCostingProfileDto, CreateCostComponentDto } from '../dto/costing-profile.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — Profiles & Components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/profile')
export class CostingProfileController {
  constructor(private readonly profileService: CostingProfileService) {}

  @Post()
  @RequirePermission('COSTING', 'PROFILE', 'create')
  @ApiOperation({ summary: 'Create a Costing Method Profile for an Item or Item Category' })
  async createCostingProfile(@Body() dto: CreateCostingProfileDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.profileService.createCostingProfile(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Costing profile created.',
      data: result,
    };
  }

  @Post('component')
  @RequirePermission('COSTING', 'PROFILE', 'create')
  @ApiOperation({ summary: 'Create a Cost Component breakdown line (Labor, Machine, Overhead)' })
  async createCostComponent(@Body() dto: CreateCostComponentDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.profileService.createCostComponent(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Cost component created.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('COSTING', 'PROFILE', 'view')
  @ApiOperation({ summary: 'List Costing Profiles for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getCostingProfiles(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.profileService.getCostingProfiles(companyId, tenantId);
    return {
      success: true,
      message: 'Costing profiles retrieved.',
      data: result,
    };
  }

  @Get('components')
  @RequirePermission('COSTING', 'PROFILE', 'view')
  @ApiOperation({ summary: 'List Cost Components for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getCostComponents(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.profileService.getCostComponents(companyId, tenantId);
    return {
      success: true,
      message: 'Cost components retrieved.',
      data: result,
    };
  }
}
