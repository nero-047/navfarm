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
import { PhysicalCountService } from '../services/physical-count.service';
import { CreateInventoryCountDto, QueryInventoryCountDto } from '../dto/journal-count.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Physical Count')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/count')
export class PhysicalCountController {
  constructor(private readonly countService: PhysicalCountService) {}

  @Post()
  @RequirePermission('INVENTORY', 'PHYSICAL_COUNT', 'create')
  @ApiOperation({ summary: 'Register a new Physical Stock Count audit draft' })
  async create(@Body() dto: CreateInventoryCountDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.countService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Physical Stock Count draft registered.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'PHYSICAL_COUNT', 'create')
  @ApiOperation({ summary: 'Post a draft Physical Count to adjust stock variances' })
  @ApiParam({ name: 'id', description: 'Physical Count UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.countService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Physical Count posted and variances adjusted.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'PHYSICAL_COUNT', 'view')
  @ApiOperation({ summary: 'Fetch details of a Physical Count' })
  @ApiParam({ name: 'id', description: 'Physical Count UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.countService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Physical Count details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'PHYSICAL_COUNT', 'view')
  @ApiOperation({ summary: 'List all Physical Counts matching filters' })
  async findAll(@Query() query: QueryInventoryCountDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.countService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Physical Counts retrieved successfully.',
      data: result
    };
  }
}
