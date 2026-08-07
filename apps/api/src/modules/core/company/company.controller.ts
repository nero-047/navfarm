import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Company Profile Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('tenant/:tenantId')
  @RequirePermission('COMPANY', 'SETTINGS', 'view')
  @ApiOperation({ summary: 'List all company profiles registered under a Tenant group (Multi-company setup)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID identifier' })
  async findByTenant(@Param('tenantId') tenantId: string, @Query() query: QueryCompanyDto) {
    return this.companyService.findByTenant(tenantId, query);
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'SETTINGS', 'view')
  @ApiOperation({ summary: 'Fetch company details by UUID' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'SETTINGS', 'create')
  @ApiOperation({ summary: 'Register a new company under the active tenant' })
  async create(@Body() dto: CreateCompanyDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.create(dto, tenantId, req.user);
  }

  @Put(':id')
  @RequirePermission('COMPANY', 'SETTINGS', 'edit')
  @ApiOperation({ summary: 'Update company profile details' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.update(id, dto, tenantId, req.user);
  }

  @Delete(':id')
  @RequirePermission('COMPANY', 'SETTINGS', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a company profile' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.remove(id, tenantId, req.user);
  }

  @Patch(':id/restore')
  @RequirePermission('COMPANY', 'SETTINGS', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted company profile' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.restore(id, tenantId, req.user);
  }
}
