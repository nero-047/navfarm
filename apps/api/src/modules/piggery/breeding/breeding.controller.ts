import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BreedingService } from './breeding.service';
import {
  CreateMatingDto,
  UpdatePregCheckDto,
  CreateFarrowingDto,
  UpdateWeaningDto,
  CreateSemenCollectionDto,
} from './dto/breeding.dto';

@ApiTags('Piggery Breeding & Reproduction')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('piggery/breeding')
export class BreedingController {
  constructor(private readonly breedingService: BreedingService) { }

  // ==========================================
  // MATING & INSEMINATION
  // ==========================================

  @Post('mating')
  @ApiOperation({ summary: 'Record sow mating or AI insemination event with auto 114-day farrowing date' })
  async recordMating(@Body() dto: CreateMatingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.recordMating(dto, tenantId, req.user);
  }

  @Patch('mating/:id/preg-check')
  @ApiOperation({ summary: 'Record pregnancy confirmation ultrasound check result' })
  async recordPregnancyCheck(
    @Param('id') id: string,
    @Body() dto: UpdatePregCheckDto,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.recordPregnancyCheck(id, dto, tenantId, req.user);
  }

  @Get('mating')
  @ApiOperation({ summary: 'List sow mating records with upcoming farrowing countdowns' })
  async getMatingRecords(@Req() req: any, @Query('company_id') companyId?: string) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.getMatingRecords(tenantId, companyId);
  }

  // ==========================================
  // FARROWING & LITTERS
  // ==========================================

  @Post('farrowing')
  @ApiOperation({ summary: 'Record sow farrowing event, live birth counts, and increment parity' })
  async recordFarrowing(@Body() dto: CreateFarrowingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.recordFarrowing(dto, tenantId, req.user);
  }

  @Patch('farrowing/:id/weaning')
  @ApiOperation({ summary: 'Record litter weaning outcome, survival rate, and return sow to active' })
  async recordWeaning(
    @Param('id') id: string,
    @Body() dto: UpdateWeaningDto,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.recordWeaning(id, dto, tenantId, req.user);
  }

  @Get('farrowing')
  @ApiOperation({ summary: 'List farrowing records with litter weights and survival rates' })
  async getFarrowingRecords(@Req() req: any, @Query('company_id') companyId?: string) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.getFarrowingRecords(tenantId, companyId);
  }

  // ==========================================
  // BOAR SEMEN AI STATION
  // ==========================================

  @Post('semen-collection')
  @ApiOperation({ summary: 'Record boar semen collection and compute unit cost per dose' })
  async recordSemenCollection(@Body() dto: CreateSemenCollectionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.recordSemenCollection(dto, tenantId, req.user);
  }

  @Get('semen-collection')
  @ApiOperation({ summary: 'List boar semen collections and doses inventory' })
  async getSemenBatches(@Req() req: any, @Query('company_id') companyId?: string) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return await this.breedingService.getSemenBatches(tenantId, companyId);
  }
}
