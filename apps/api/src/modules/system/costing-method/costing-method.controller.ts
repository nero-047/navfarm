import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CostingMethodService } from './costing-method.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SystemAdminGuard } from '../../../common/guards/system-admin.guard';
import { CreateCostingMethodDto, UpdateCostingMethodDto } from './dto/costing-method.dto';

@ApiTags('Costing Method Master')
@Controller('costing-method')
export class CostingMethodController {
  constructor(private readonly costingMethodService: CostingMethodService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all active costing methods' })
  async listCostingMethods() {
    return this.costingMethodService.listCostingMethods();
  }

  @Post()
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Create a new costing method' })
  async createCostingMethod(@Body() body: CreateCostingMethodDto) {
    return this.costingMethodService.createCostingMethod(body);
  }

  @Put(':code')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Update costing method details' })
  @ApiParam({ name: 'code', description: 'Costing method code' })
  async updateCostingMethod(@Param('code') code: string, @Body() body: UpdateCostingMethodDto) {
    return this.costingMethodService.updateCostingMethod(code, body);
  }

  @Delete(':code')
  @UseGuards(JwtAuthGuard, SystemAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Platform Admin: Delete a costing method (rejected for system methods)' })
  @ApiParam({ name: 'code', description: 'Costing method code' })
  async deleteCostingMethod(@Param('code') code: string) {
    return this.costingMethodService.deleteCostingMethod(code);
  }
}
