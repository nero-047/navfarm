import { Controller, Get, Post, Put, Delete, Param, Body, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Company Profile Management')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'List all company profiles registered under a Tenant group (Multi-company setup)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant UUID identifier' })
  async findByTenant(@Param('tenantId') tenantId: string) {
    return this.companyService.findByTenant(tenantId);
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
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate (soft-delete) a company profile' })
  @ApiParam({ name: 'id', description: 'Company UUID identifier' })
  async remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}
