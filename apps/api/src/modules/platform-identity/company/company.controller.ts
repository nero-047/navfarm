import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Company Profile Management')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'List all company profiles registered under a Tenant group (Multi-company setup)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID identifier' })
  async findByTenant(@Param('tenantId') tenantId: string, @Query() query: QueryCompanyDto) {
    return this.companyService.findByTenant(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch company details by UUID' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new company under the active tenant' })
  async create(@Body() dto: CreateCompanyDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.create(dto, tenantId, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update company profile details' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.update(id, dto, tenantId, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate (soft-delete) a company profile' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.remove(id, tenantId, req.user);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted company profile' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.companyService.restore(id, tenantId, req.user);
  }
}
