import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FiscalService } from '../services/fiscal.service';
import { CreateFiscalYearDto, QueryFiscalYearDto } from '../dto/fiscal.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Fiscal Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Post('year')
  @RequirePermission('FINANCE', 'FISCAL', 'create')
  @ApiOperation({ summary: 'Create a new Fiscal Year & auto-bootstrap 12 accounting periods' })
  async createFiscalYear(@Body() dto: CreateFiscalYearDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.createFiscalYear(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Fiscal Year created and 12 accounting periods bootstrapped.',
      data: result
    };
  }

  @Post('year/:id/close')
  @RequirePermission('FINANCE', 'FISCAL', 'update')
  @ApiOperation({ summary: 'Close a Fiscal Year and lock all monthly periods' })
  @ApiParam({ name: 'id', description: 'Fiscal Year UUID' })
  async closeFiscalYear(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.closeFiscalYear(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: result.message,
      data: null
    };
  }

  @Post('period/:id/close')
  @RequirePermission('FINANCE', 'FISCAL', 'update')
  @ApiOperation({ summary: 'Lock a specific Accounting Period to prevent postings' })
  @ApiParam({ name: 'id', description: 'Accounting Period UUID' })
  async closePeriod(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.closePeriod(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: result.message,
      data: null
    };
  }

  @Post('period/:id/reopen')
  @RequirePermission('FINANCE', 'FISCAL', 'update')
  @ApiOperation({ summary: 'Unlock a specific locked Accounting Period' })
  @ApiParam({ name: 'id', description: 'Accounting Period UUID' })
  async reopenPeriod(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.reopenPeriod(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: result.message,
      data: null
    };
  }

  @Get('year/:id')
  @RequirePermission('FINANCE', 'FISCAL', 'view')
  @ApiOperation({ summary: 'Fetch details of a Fiscal Year and its monthly periods' })
  @ApiParam({ name: 'id', description: 'Fiscal Year UUID' })
  async findOneFiscalYear(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.findOneFiscalYear(id, tenantId);
    return {
      success: true,
      message: 'Fiscal Year details retrieved.',
      data: result
    };
  }

  @Get('year')
  @RequirePermission('FINANCE', 'FISCAL', 'view')
  @ApiOperation({ summary: 'List all Fiscal Years matching filters' })
  async findAllFiscalYears(@Query() query: QueryFiscalYearDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fiscalService.findAllFiscalYears(query, tenantId);
    return {
      success: true,
      message: 'Fiscal Years retrieved successfully.',
      data: result
    };
  }
}
