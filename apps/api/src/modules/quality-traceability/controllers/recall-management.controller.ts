import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RecallManagementService } from '../services/recall-management.service';
import { InitiateRecallDto } from '../dto/recall.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Product Recall Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/recall')
export class RecallManagementController {
  constructor(private readonly recallService: RecallManagementService) {}

  @Post('initiate')
  @RequirePermission('QUALITY', 'RECALL', 'create')
  @ApiOperation({ summary: 'Initiate Product Recall & Block Affected Warehouse Inventory' })
  async initiateRecall(@Body() dto: InitiateRecallDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.recallService.initiateRecall(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Product Recall initiated and affected stock placed on quarantine hold.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('QUALITY', 'RECALL', 'view')
  @ApiOperation({ summary: 'List Product Recalls for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getRecalls(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.recallService.getRecalls(companyId, tenantId);
    return {
      success: true,
      message: 'Product recalls retrieved.',
      data: result,
    };
  }
}
