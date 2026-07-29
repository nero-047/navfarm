import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { HerdService } from '../services/herd.service';
import { CreateHerdDto } from '../dto/herd.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Livestock — Herd Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livestock/herd')
export class HerdController {
  constructor(private readonly svc: HerdService) {}

  @Post()
  @RequirePermission('LIVESTOCK', 'HERD', 'create')
  @ApiOperation({ summary: 'Create a new livestock herd (DAIRY/BEEF/PIGGERY/GOAT/SHEEP)' })
  async createHerd(@Body() dto: CreateHerdDto, @Req() req: any) {
    const result = await this.svc.createHerd(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId);
    return { success: true, message: 'Herd created.', data: result };
  }

  @Get()
  @RequirePermission('LIVESTOCK', 'HERD', 'view')
  @ApiOperation({ summary: 'List all herds for tenant' })
  async listHerds(@Req() req: any) {
    return { success: true, data: await this.svc.listHerds(req.user?.tenantId) };
  }

  @Get(':herdId')
  @RequirePermission('LIVESTOCK', 'HERD', 'view')
  @ApiParam({ name: 'herdId' })
  @ApiOperation({ summary: 'Get herd detail by ID' })
  async getHerd(@Param('herdId') herdId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getHerd(herdId, req.user?.tenantId) };
  }
}
