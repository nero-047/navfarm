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
  UseGuards, 
  Patch 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ShedService } from './shed.service';
import { CreateShedDto, UpdateShedDto, QueryShedDto } from './dto/shed.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Shed Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shed')
export class ShedController {
  constructor(private readonly shedService: ShedService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'SHED', 'create')
  @ApiOperation({ summary: 'Register a new Shed' })
  async create(@Body() dto: CreateShedDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.shedService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'Shed registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'SHED', 'view')
  @ApiOperation({ summary: 'List all Sheds matching filters' })
  async findAll(@Query() query: QueryShedDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.shedService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Sheds retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'SHED', 'view')
  @ApiOperation({ summary: 'Fetch details of a single Shed by UUID' })
  @ApiParam({ name: 'id', description: 'Shed UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.shedService.findOne(id);
    return {
      success: true,
      message: 'Shed details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'SHED', 'edit')
  @ApiOperation({ summary: 'Update details of an existing Shed' })
  @ApiParam({ name: 'id', description: 'Shed UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateShedDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.shedService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'Shed updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'SHED', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a Shed profile' })
  @ApiParam({ name: 'id', description: 'Shed UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.shedService.remove(id, tenantId, req.user);
    return {
      success: true,
      ...result
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'SHED', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted Shed profile' })
  @ApiParam({ name: 'id', description: 'Shed UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.shedService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'Shed restored successfully.',
      data: result
    };
  }
}
