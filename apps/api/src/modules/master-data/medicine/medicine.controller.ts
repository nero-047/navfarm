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
import { MedicineService } from './medicine.service';
import { CreateMedicineDto, UpdateMedicineDto, QueryMedicineDto } from './dto/medicine.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Medicine Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicine')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Post()
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'create')
  @ApiOperation({ summary: 'Register a new Medicine profile' })
  async create(@Body() dto: CreateMedicineDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.medicineService.create(dto, tenantId, req.user);
    return {
      success: true,
      message: 'Medicine profile registered successfully.',
      data: result
    };
  }

  @Get()
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'view')
  @ApiOperation({ summary: 'List all Medicine profiles matching filters' })
  async findAll(@Query() query: QueryMedicineDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.medicineService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Medicine profiles retrieved successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'view')
  @ApiOperation({ summary: 'Fetch details of a single Medicine profile by UUID' })
  @ApiParam({ name: 'id', description: 'Medicine UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.medicineService.findOne(id);
    return {
      success: true,
      message: 'Medicine details retrieved.',
      data: result
    };
  }

  @Put(':id')
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'edit')
  @ApiOperation({ summary: 'Update details of an existing Medicine profile' })
  @ApiParam({ name: 'id', description: 'Medicine UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateMedicineDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.medicineService.update(id, dto, tenantId, req.user);
    return {
      success: true,
      message: 'Medicine profile updated successfully.',
      data: result
    };
  }

  @Delete(':id')
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'delete')
  @ApiOperation({ summary: 'Deactivate (soft-delete) a Medicine profile' })
  @ApiParam({ name: 'id', description: 'Medicine UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.medicineService.remove(id, tenantId, req.user);
    return {
      ...result,
    };
  }

  @Patch(':id/restore')
  @RequirePermission('MASTER_DATA', 'MEDICINE', 'edit')
  @ApiOperation({ summary: 'Restore a soft-deleted Medicine profile' })
  @ApiParam({ name: 'id', description: 'Medicine UUID' })
  async restore(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.medicineService.restore(id, tenantId, req.user);
    return {
      success: true,
      message: 'Medicine profile restored successfully.',
      data: result
    };
  }
}
