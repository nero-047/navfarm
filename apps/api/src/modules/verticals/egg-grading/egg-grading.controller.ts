import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EggGradingService } from './egg-grading.service';
import { CreateEggGradingBatchDto } from './dto/egg-grading.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Egg Grading (Poultry)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/egg-grading')
export class EggGradingController {
  constructor(private readonly svc: EggGradingService) {}

  @Post()
  @RequirePermission('POULTRY', 'EGG_GRADING', 'create')
  @ApiOperation({ summary: 'Submit egg grading batch (XL/L/M/S/Reject quantities)' })
  async createGradingBatch(@Body() dto: CreateEggGradingBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const companyId = req.user?.companyId || req['companyId'];
    const userId = req.user?.userId;
    const result = await this.svc.createGradingBatch(dto, tenantId, companyId, userId);
    return { success: true, message: 'Egg grading batch created.', data: result };
  }

  @Get(':batchId')
  @RequirePermission('POULTRY', 'EGG_GRADING', 'view')
  @ApiOperation({ summary: 'Get all egg grading records for a poultry batch' })
  @ApiParam({ name: 'batchId', description: 'Poultry batch UUID' })
  async getGradingForBatch(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.getGradingForBatch(batchId, tenantId);
    return { success: true, message: 'Egg grading records retrieved.', data: result };
  }
}
