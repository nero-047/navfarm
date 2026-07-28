import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VarianceAnalysisService } from '../services/variance-analysis.service';
import { CalculateVarianceDto } from '../dto/variance-analysis.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — Enterprise Variance Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/variance')
export class VarianceAnalysisController {
  constructor(private readonly varianceService: VarianceAnalysisService) {}

  @Post('calculate')
  @RequirePermission('COSTING', 'VARIANCE', 'edit')
  @ApiOperation({ summary: 'Calculate 7-dimension variance analysis & post GL journal entry' })
  async calculateVarianceAnalysis(@Body() dto: CalculateVarianceDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.varianceService.calculateVarianceAnalysis(dto.batch_id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Variance analysis compiled and GL journal posted.',
      data: result,
    };
  }
}
