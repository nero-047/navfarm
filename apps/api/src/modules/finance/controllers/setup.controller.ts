import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DimensionService } from '../services/dimension.service';
import { 
  CreateDimensionDto, 
  CreateDimensionValueDto, 
  QueryDimensionDto, 
  QueryDimensionValueDto 
} from '../dto/dimension.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Financial Metadata Setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/setup')
export class SetupController {
  constructor(private readonly dimService: DimensionService) {}

  @Post('dimension')
  @RequirePermission('FINANCE', 'SETUP', 'create')
  @ApiOperation({ summary: 'Register a new global reporting Financial Dimension' })
  async createDimension(@Body() dto: CreateDimensionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dimService.createDimension(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Financial Dimension registered successfully.',
      data: result
    };
  }

  @Post('dimension-value')
  @RequirePermission('FINANCE', 'SETUP', 'create')
  @ApiOperation({ summary: 'Append a valid value to an active Financial Dimension' })
  async createDimensionValue(@Body() dto: CreateDimensionValueDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dimService.createDimensionValue(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Dimension Value registered.',
      data: result
    };
  }

  @Get('dimension')
  @RequirePermission('FINANCE', 'SETUP', 'view')
  @ApiOperation({ summary: 'List all registered Financial Dimensions' })
  async findAllDimensions(@Query() query: QueryDimensionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dimService.findAllDimensions(query, tenantId);
    return {
      success: true,
      message: 'Financial Dimensions list retrieved.',
      data: result
    };
  }

  @Get('dimension-value')
  @RequirePermission('FINANCE', 'SETUP', 'view')
  @ApiOperation({ summary: 'List all Dimension Values matching filters' })
  async findAllDimensionValues(@Query() query: QueryDimensionValueDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dimService.findAllDimensionValues(query, tenantId);
    return {
      success: true,
      message: 'Dimension Values list retrieved.',
      data: result
    };
  }
}
