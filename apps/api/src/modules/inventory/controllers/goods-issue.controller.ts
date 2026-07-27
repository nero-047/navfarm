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
import { GoodsIssueService } from '../services/goods-issue.service';
import { CreateGoodsIssueDto, QueryGoodsIssueDto } from '../dto/goods-issue.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Goods Issue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/goods-issue')
export class GoodsIssueController {
  constructor(private readonly issueService: GoodsIssueService) {}

  @Post()
  @RequirePermission('INVENTORY', 'GOODS_ISSUE', 'create')
  @ApiOperation({ summary: 'Register a new Goods Issue draft' })
  async create(@Body() dto: CreateGoodsIssueDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.issueService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Goods Issue registered as DRAFT.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'GOODS_ISSUE', 'create')
  @ApiOperation({ summary: 'Post a draft Goods Issue to ledger entries' })
  @ApiParam({ name: 'id', description: 'Goods Issue UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.issueService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Goods Issue posted to stock ledger.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'GOODS_ISSUE', 'view')
  @ApiOperation({ summary: 'Fetch details of a Goods Issue' })
  @ApiParam({ name: 'id', description: 'Goods Issue UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.issueService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Goods Issue details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'GOODS_ISSUE', 'view')
  @ApiOperation({ summary: 'List all Goods Issues matching filters' })
  async findAll(@Query() query: QueryGoodsIssueDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.issueService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Goods Issues retrieved successfully.',
      data: result
    };
  }
}
