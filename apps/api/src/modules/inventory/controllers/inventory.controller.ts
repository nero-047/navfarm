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
import { InventoryLedgerService } from '../services/inventory-ledger.service';
import { FifoEngineService } from '../services/fifo-engine.service';
import { LotService } from '../services/lot.service';
import { SerialService } from '../services/serial.service';
import { ReservationService } from '../services/reservation.service';
import { InventoryQueryDto, ValuationQueryDto } from '../dto/inventory-query.dto';
import { CreateLotDto, QueryLotDto, CreateSerialDto, QuerySerialDto } from '../dto/lot-serial.dto';
import { CreateReservationDto, QueryReservationDto } from '../dto/reservation.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Inventory Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly ledgerService: InventoryLedgerService,
    private readonly fifoService: FifoEngineService,
    private readonly lotService: LotService,
    private readonly serialService: SerialService,
    private readonly reservationService: ReservationService,
  ) {}

  @Get('balance')
  @RequirePermission('INVENTORY', 'PORTAL', 'view')
  @ApiOperation({ summary: 'Inquire stock balances (on hand, reserved, available)' })
  async getBalance(@Query() query: InventoryQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    if (!query.itemId || !query.warehouseId || !query.locationId) {
      return {
        success: false,
        message: 'itemId, warehouseId, and locationId are required query parameters for balance checks.',
        data: null
      };
    }
    const result = await this.ledgerService.getBalance(
      query.itemId,
      query.warehouseId,
      query.locationId,
      query.lotId || null,
      query.serialId || null,
      tenantId
    );
    return {
      success: true,
      message: 'Stock balances retrieved successfully.',
      data: result
    };
  }

  @Get('available')
  @RequirePermission('INVENTORY', 'PORTAL', 'view')
  @ApiOperation({ summary: 'Quick check of available stock quantity' })
  async getAvailableStock(@Query() query: InventoryQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    if (!query.itemId || !query.warehouseId || !query.locationId) {
      return {
        success: false,
        message: 'itemId, warehouseId, and locationId are required query parameters for availability checks.',
        data: 0
      };
    }
    const result = await this.ledgerService.getAvailableStock(
      query.itemId,
      query.warehouseId,
      query.locationId,
      query.lotId || null,
      query.serialId || null,
      tenantId
    );
    return {
      success: true,
      message: 'Available stock quantity retrieved.',
      data: result
    };
  }

  @Get('valuation')
  @RequirePermission('INVENTORY', 'PORTAL', 'view')
  @ApiOperation({ summary: 'Calculate inventory cost valuation based on FIFO layers' })
  async getValuation(@Query() query: ValuationQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.fifoService.getValuationReport(
      query.companyId,
      query.itemId,
      query.warehouseId,
      tenantId
    );
    return {
      success: true,
      message: 'Inventory cost valuation report compiled.',
      data: result
    };
  }

  // LOT PORTAL
  @Post('lot')
  @RequirePermission('INVENTORY', 'LOT', 'create')
  @ApiOperation({ summary: 'Manually register a new lot master batch' })
  async createLot(@Body() dto: CreateLotDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const lotId = await this.lotService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Lot registered successfully.',
      data: { lotId }
    };
  }

  @Get('lot')
  @RequirePermission('INVENTORY', 'LOT', 'view')
  @ApiOperation({ summary: 'List all Lot master batches matching filters' })
  async findAllLots(@Query() query: QueryLotDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.lotService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Lot batches retrieved.',
      data: result
    };
  }

  @Get('lot/:id')
  @RequirePermission('INVENTORY', 'LOT', 'view')
  @ApiOperation({ summary: 'Retrieve detail of a Lot batch by ID' })
  @ApiParam({ name: 'id', description: 'Lot UUID' })
  async findOneLot(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.lotService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Lot batch details retrieved.',
      data: result
    };
  }

  // SERIAL PORTAL
  @Post('serial')
  @RequirePermission('INVENTORY', 'SERIAL', 'create')
  @ApiOperation({ summary: 'Manually register a new serial master' })
  async createSerial(@Body() dto: CreateSerialDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const serialId = await this.serialService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Serial number registered.',
      data: { serialId }
    };
  }

  @Get('serial')
  @RequirePermission('INVENTORY', 'SERIAL', 'view')
  @ApiOperation({ summary: 'List all Serial masters matching filters' })
  async findAllSerials(@Query() query: QuerySerialDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.serialService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Serials list retrieved.',
      data: result
    };
  }

  // RESERVATION PORTAL
  @Post('reserve')
  @RequirePermission('INVENTORY', 'RESERVATION', 'create')
  @ApiOperation({ summary: 'Establish a new stock reservation' })
  async reserve(@Body() dto: CreateReservationDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const reservationId = await this.reservationService.reserve(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory reserved successfully.',
      data: { reservationId }
    };
  }

  @Post('reserve/:id/release')
  @RequirePermission('INVENTORY', 'RESERVATION', 'create')
  @ApiOperation({ summary: 'Manually release an active stock reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  async release(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    await this.reservationService.release(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory reservation released.',
      data: null
    };
  }

  @Get('reservations')
  @RequirePermission('INVENTORY', 'RESERVATION', 'view')
  @ApiOperation({ summary: 'List all reservations matching filters' })
  async findAllReservations(@Query() query: QueryReservationDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reservationService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Reservations retrieved.',
      data: result
    };
  }
}
