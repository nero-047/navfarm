import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FarmToForkTrackerService } from '../services/farm-to-fork-tracker.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Farm-to-Fork Journey Tracker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/farm-to-fork')
export class FarmToForkController {
  constructor(private readonly f2fService: FarmToForkTrackerService) {}

  @Get(':batchId')
  @RequirePermission('QUALITY', 'FARM_TO_FORK', 'view')
  @ApiOperation({ summary: 'Compile end-to-end Farm-to-Fork supply chain journey map' })
  @ApiParam({ name: 'batchId', description: 'Production Batch UUID' })
  async getFarmToForkJourney(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.f2fService.getFarmToForkJourney(batchId, tenantId);
    return {
      success: true,
      message: 'Farm-to-Fork supply chain journey map compiled.',
      data: result,
    };
  }
}
