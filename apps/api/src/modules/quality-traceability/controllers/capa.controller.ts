import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { CapaService } from '../services/capa.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNcrDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'inspection-uuid', required: false })
  @IsString()
  @IsOptional()
  inspection_id?: string;

  @ApiProperty({ example: 'MAJOR', description: 'CRITICAL, MAJOR, MINOR' })
  @IsString()
  @IsNotEmpty()
  severity: string;

  @ApiProperty({ example: 'Contamination detected in feed lot receiving' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Improper storage sealing at supplier warehouse', required: false })
  @IsString()
  @IsOptional()
  root_cause?: string;
}

export class CreateCapaDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'ncr-uuid' })
  @IsString()
  @IsNotEmpty()
  ncr_id: string;

  @ApiProperty({ example: 'Reject lot and replace supplier shipment' })
  @IsString()
  @IsNotEmpty()
  corrective_action: string;

  @ApiProperty({ example: 'Require supplier seal verification certificate prior to dispatch' })
  @IsString()
  @IsNotEmpty()
  preventive_action: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsString()
  @IsOptional()
  assigned_to?: string;
}

@ApiTags('Quality & Traceability — CAPA & Non-Conformance Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/capa')
export class CapaController {
  constructor(private readonly capaService: CapaService) {}

  @Post('ncr')
  @RequirePermission('QUALITY', 'CAPA', 'create')
  @ApiOperation({ summary: 'Log Non-Conformance Report (NCR)' })
  async createNcr(@Body() dto: CreateNcrDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.capaService.createNcr(
      dto.company_id,
      dto.inspection_id || null,
      dto.severity,
      dto.description,
      dto.root_cause || null,
      tenantId
    );
    return {
      success: true,
      message: 'Non-Conformance Report logged.',
      data: result,
    };
  }

  @Post()
  @RequirePermission('QUALITY', 'CAPA', 'create')
  @ApiOperation({ summary: 'Create Corrective & Preventive Action (CAPA) plan' })
  async createCapa(@Body() dto: CreateCapaDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.capaService.createCapa(
      dto.company_id,
      dto.ncr_id,
      dto.corrective_action,
      dto.preventive_action,
      dto.assigned_to || null,
      tenantId
    );
    return {
      success: true,
      message: 'CAPA plan created.',
      data: result,
    };
  }

  @Get('ncrs')
  @RequirePermission('QUALITY', 'CAPA', 'view')
  @ApiOperation({ summary: 'List Non-Conformance Reports for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getNcrs(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.capaService.getNcrs(companyId, tenantId);
    return {
      success: true,
      message: 'NCRs retrieved.',
      data: result,
    };
  }

  @Get('capas')
  @RequirePermission('QUALITY', 'CAPA', 'view')
  @ApiOperation({ summary: 'List CAPA Plans for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getCapas(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.capaService.getCapas(companyId, tenantId);
    return {
      success: true,
      message: 'CAPA plans retrieved.',
      data: result,
    };
  }
}
