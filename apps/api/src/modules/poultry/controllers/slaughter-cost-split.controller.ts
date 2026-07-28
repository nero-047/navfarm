import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { SlaughterCostSplitService } from '../services/slaughter-cost-split.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { IsString, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';

export class ConfigureSlaughterCostSplitDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_main_product: boolean;

  @ApiProperty({ example: 85.00, description: 'Percentage split (e.g., 85.00 for main meat, 5.00 for offal)' })
  @IsNumber()
  @IsNotEmpty()
  cost_split_pct: number;
}

@ApiTags('Poultry — Slaughter Joint-Cost Allocation Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/slaughter/cost-split-config')
export class SlaughterCostSplitController {
  constructor(private readonly costSplitService: SlaughterCostSplitService) {}

  @Post()
  @RequirePermission('POULTRY', 'SLAUGHTER', 'create')
  @ApiOperation({ summary: 'Configure joint-cost allocation split % for slaughter products' })
  async configureCostSplit(@Body() dto: ConfigureSlaughterCostSplitDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.costSplitService.configureCostSplit(
      dto.company_id,
      dto.item_id,
      dto.is_main_product,
      dto.cost_split_pct,
      tenantId
    );
    return {
      success: true,
      message: 'Slaughter joint-cost split rule configured.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('POULTRY', 'SLAUGHTER', 'view')
  @ApiOperation({ summary: 'Fetch slaughter joint-cost split rules for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getCostSplitConfigs(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.costSplitService.getCostSplitConfigs(companyId, tenantId);
    return {
      success: true,
      message: 'Slaughter joint-cost split rules retrieved.',
      data: result,
    };
  }
}
