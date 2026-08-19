import { Controller, Get, Post, Put, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AnimalService } from './animal.service';
import { CreateAnimalDto, UpdateAnimalDto, DisposeAnimalDto, QueryAnimalDto } from './dto/animal.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Animal Register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('animal')
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  @Post()
  @RequirePermission('PIGGERY', 'ANIMAL', 'create')
  @ApiOperation({ summary: 'Register a new animal — animal_code is auto-generated (ANIMAL_PIGGERY series)' })
  async create(@Body() dto: CreateAnimalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.animalService.create(dto, tenantId, req.user);
    return { success: true, message: 'Animal registered successfully.', data: result };
  }

  @Get()
  @RequirePermission('PIGGERY', 'ANIMAL', 'view')
  @ApiOperation({ summary: 'List animals matching filters (disposed animals excluded unless includeDisposed=true)' })
  async findAll(@Query() query: QueryAnimalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.animalService.findAll(query, tenantId);
    return { success: true, message: 'Animals retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('PIGGERY', 'ANIMAL', 'view')
  @ApiOperation({ summary: 'Fetch a single animal' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.animalService.findOne(id);
    return { success: true, message: 'Animal retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('PIGGERY', 'ANIMAL', 'edit')
  @ApiOperation({ summary: 'Update an animal record' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async update(@Param('id') id: string, @Body() dto: UpdateAnimalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.animalService.update(id, dto, tenantId, req.user);
    return { success: true, message: 'Animal updated successfully.', data: result };
  }

  @Patch(':id/dispose')
  @RequirePermission('PIGGERY', 'ANIMAL', 'edit')
  @ApiOperation({ summary: 'Dispose an animal (sold/slaughtered/died/transferred) — never physically deleted' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  async dispose(@Param('id') id: string, @Body() dto: DisposeAnimalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.animalService.dispose(id, dto, tenantId, req.user);
    return { success: true, message: 'Animal disposal recorded.', data: result };
  }
}
