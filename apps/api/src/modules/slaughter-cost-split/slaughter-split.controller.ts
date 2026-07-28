import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SlaughterSplitService } from './slaughter-split.service';
import { ConfigureSlaughterSplitDto, ApplySlaughterSplitDto } from './dto/slaughter-split.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Multi-LOB Slaughter Cost Split (GAP 10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/slaughter-split')
export class SlaughterSplitController {
  constructor(private readonly svc: SlaughterSplitService) {}

  @Post('configure')
  @RequirePermission('COSTING', 'SLAUGHTER_SPLIT', 'create')
  @ApiOperation({ summary: 'Configure slaughter cost split products & % for any LOB (Poultry, Aqua, etc.)' })
  async configureSplit(@Body() dto: ConfigureSlaughterSplitDto) {
    const result = await this.svc.configureSplit(dto);
    return { success: true, message: 'Slaughter cost split configured.', data: result };
  }

  @Get(':lobId')
  @RequirePermission('COSTING', 'SLAUGHTER_SPLIT', 'view')
  @ApiParam({ name: 'lobId', description: 'LOB UUID' })
  @ApiOperation({ summary: 'Get slaughter cost split configuration for a specific LOB' })
  async getSplitConfig(@Param('lobId') lobId: string) {
    const result = await this.svc.getSplitConfig(lobId);
    return { success: true, message: 'Split config retrieved.', data: result };
  }

  @Post('apply')
  @RequirePermission('COSTING', 'SLAUGHTER_SPLIT', 'view')
  @ApiOperation({ summary: 'Apply slaughter cost split: input total cost → get per-product allocated cost + unit cost/kg' })
  async applySlaughterSplit(@Body() dto: ApplySlaughterSplitDto) {
    const result = await this.svc.applySlaughterSplit(dto);
    return { success: true, message: 'Slaughter cost split applied.', data: result };
  }
}
