import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnimalService } from '../services/animal.service';
import {
  RegisterAnimalDto, RecordWeightDto, RecordVaccinationDto, RecordTreatmentDto,
  RecordMovementDto, RecordBreedingDto, ConfirmPregnancyDto, RecordCalvingDto,
  RecordMilkProductionDto, RecordMortalityDto
} from '../dto/animal.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Livestock — Individual Animal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livestock/animal')
export class AnimalController {
  constructor(private readonly svc: AnimalService) {}

  @Post()
  @RequirePermission('LIVESTOCK', 'ANIMAL', 'create')
  @ApiOperation({ summary: 'Register individual animal with ear tag (unique per tenant)' })
  async register(@Body() dto: RegisterAnimalDto, @Req() req: any) {
    const result = await this.svc.registerAnimal(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId);
    return { success: true, message: 'Animal registered.', data: result };
  }

  @Get()
  @RequirePermission('LIVESTOCK', 'ANIMAL', 'view')
  @ApiQuery({ name: 'herdId', required: false })
  @ApiOperation({ summary: 'List animals (optionally filter by herd)' })
  async listAnimals(@Query('herdId') herdId: string, @Req() req: any) {
    return { success: true, data: await this.svc.listAnimals(req.user?.tenantId, herdId) };
  }

  @Get(':animalId')
  @RequirePermission('LIVESTOCK', 'ANIMAL', 'view')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Get individual animal details by ID' })
  async getAnimal(@Param('animalId') animalId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getAnimal(animalId, req.user?.tenantId) };
  }

  @Post(':animalId/weight')
  @RequirePermission('LIVESTOCK', 'WEIGHT', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record weight for an animal (includes body condition score)' })
  async recordWeight(@Param('animalId') animalId: string, @Body() dto: RecordWeightDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordWeight(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get(':animalId/weight-history')
  @RequirePermission('LIVESTOCK', 'WEIGHT', 'view')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Get weight history (growth chart data) for an animal' })
  async getWeightHistory(@Param('animalId') animalId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getWeightHistory(animalId, req.user?.tenantId) };
  }

  @Post(':animalId/vaccination')
  @RequirePermission('LIVESTOCK', 'VACCINATION', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record vaccination event for an animal (tracks next due date)' })
  async recordVaccination(@Param('animalId') animalId: string, @Body() dto: RecordVaccinationDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordVaccination(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get(':animalId/vaccination-history')
  @RequirePermission('LIVESTOCK', 'VACCINATION', 'view')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Get vaccination history for an animal' })
  async getVaccinationHistory(@Param('animalId') animalId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getVaccinationHistory(animalId, req.user?.tenantId) };
  }

  @Post(':animalId/treatment')
  @RequirePermission('LIVESTOCK', 'TREATMENT', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record veterinary treatment/medicine (includes milk withdrawal period)' })
  async recordTreatment(@Param('animalId') animalId: string, @Body() dto: RecordTreatmentDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordTreatment(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post(':animalId/movement')
  @RequirePermission('LIVESTOCK', 'MOVEMENT', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Transfer animal to new location/herd (updates herd sizes automatically)' })
  async recordMovement(@Param('animalId') animalId: string, @Body() dto: RecordMovementDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordMovement(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post(':animalId/breeding')
  @RequirePermission('LIVESTOCK', 'BREEDING', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record AI or natural service breeding event' })
  async recordBreeding(@Param('animalId') animalId: string, @Body() dto: RecordBreedingDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordBreeding(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post(':animalId/breeding/:breedingId/pregnancy')
  @RequirePermission('LIVESTOCK', 'BREEDING', 'edit')
  @ApiParam({ name: 'animalId' }) @ApiParam({ name: 'breedingId' })
  @ApiOperation({ summary: 'Confirm/reject pregnancy via PD result (updates animal pregnancy status)' })
  async confirmPregnancy(@Param('breedingId') breedingId: string, @Body() dto: ConfirmPregnancyDto, @Req() req: any) {
    return { success: true, data: await this.svc.confirmPregnancy(breedingId, dto, req.user?.tenantId) };
  }

  @Post(':animalId/breeding/:breedingId/calving')
  @RequirePermission('LIVESTOCK', 'CALVING', 'create')
  @ApiParam({ name: 'animalId' }) @ApiParam({ name: 'breedingId' })
  @ApiOperation({ summary: 'Record calving event (increments lactation number, resets pregnancy status)' })
  async recordCalving(@Param('breedingId') breedingId: string, @Body() dto: RecordCalvingDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordCalving(breedingId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post(':animalId/milk')
  @RequirePermission('LIVESTOCK', 'MILK', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record daily milk production with quality parameters (fat%, SNF%, SCC)' })
  async recordMilk(@Param('animalId') animalId: string, @Body() dto: RecordMilkProductionDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordMilkProduction(animalId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get(':animalId/milk-history')
  @RequirePermission('LIVESTOCK', 'MILK', 'view')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Get milk production history for an animal' })
  async getMilkHistory(@Param('animalId') animalId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getMilkHistory(animalId, req.user?.tenantId) };
  }

  @Post(':animalId/mortality')
  @RequirePermission('LIVESTOCK', 'MORTALITY', 'create')
  @ApiParam({ name: 'animalId' })
  @ApiOperation({ summary: 'Record animal death (updates status to DEAD, decrements herd size)' })
  async recordMortality(@Param('animalId') animalId: string, @Body() dto: RecordMortalityDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordMortality(animalId, dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }
}
