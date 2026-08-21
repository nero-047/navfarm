import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { OperationalAreaService } from './operational-area.service';
import { CreateOperationalAreaDto, UpdateOperationalAreaDto, AssignUserToAreaDto } from './dto/operational-area.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('operational-area')
@UseGuards(JwtAuthGuard)
export class OperationalAreaController {
  constructor(private readonly areaService: OperationalAreaService) {}

  @Get()
  async findAll(@Query('company_id') companyId?: string) {
    return this.areaService.findAll(companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.areaService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateOperationalAreaDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.areaService.create(dto, userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOperationalAreaDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.areaService.update(id, dto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.areaService.delete(id);
  }

  @Post('assign-user')
  async assignUser(@Body() dto: AssignUserToAreaDto) {
    return this.areaService.assignUser(dto);
  }

  @Get('user/:userId')
  async getUserAssignedAreas(@Param('userId') userId: string) {
    return this.areaService.getUserAssignedAreas(userId);
  }

  @Post('preseed-company/:companyId')
  async preseedCompany(@Param('companyId') companyId: string) {
    return this.areaService.preseedCompanyMasterDataFromTenant(companyId);
  }
}
