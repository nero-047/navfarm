import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CoaService } from '../services/coa.service';
import { CreateGlAccountDto, UpdateGlAccountDto, QueryGlAccountDto } from '../dto/gl-account.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Chart of Accounts (COA)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/coa')
export class CoaController {
  constructor(private readonly coaService: CoaService) {}

  @Post()
  @RequirePermission('FINANCE', 'COA', 'create')
  @ApiOperation({ summary: 'Create a new GL Account inside the Chart of Accounts' })
  async create(@Body() dto: CreateGlAccountDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'GL Account created successfully.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('FINANCE', 'COA', 'update')
  @ApiOperation({ summary: 'Update validation constraints or labels of a GL Account' })
  @ApiParam({ name: 'id', description: 'GL Account UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateGlAccountDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.update(id, dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'GL Account updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('FINANCE', 'COA', 'delete')
  @ApiOperation({ summary: 'Soft delete a GL Account if no ledger history exists' })
  @ApiParam({ name: 'id', description: 'GL Account UUID' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.delete(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: result.message,
      data: null
    };
  }

  @Get('tree')
  @RequirePermission('FINANCE', 'COA', 'view')
  @ApiOperation({ summary: 'Retrieve hierarchical tree structure of the Chart of Accounts' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID filter' })
  async getTree(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.getTree(companyId, tenantId);
    return {
      success: true,
      message: 'Chart of accounts hierarchical tree structure retrieved.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('FINANCE', 'COA', 'view')
  @ApiOperation({ summary: 'Get details of a specific GL Account' })
  @ApiParam({ name: 'id', description: 'GL Account UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.findOne(id, tenantId);
    return {
      success: true,
      message: 'GL Account details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('FINANCE', 'COA', 'view')
  @ApiOperation({ summary: 'List all GL Accounts matching filters' })
  async findAll(@Query() query: QueryGlAccountDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.coaService.findAll(query, tenantId);
    return {
      success: true,
      message: 'GL Accounts list retrieved.',
      data: result
    };
  }
}
