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
import { InventoryJournalService } from '../services/inventory-journal.service';
import { CreateInventoryJournalDto, QueryInventoryJournalDto } from '../dto/journal-count.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Inventory Journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory/journal')
export class InventoryJournalController {
  constructor(private readonly journalService: InventoryJournalService) {}

  @Post()
  @RequirePermission('INVENTORY', 'JOURNAL', 'create')
  @ApiOperation({ summary: 'Register a new Inventory Journal correction draft' })
  async create(@Body() dto: CreateInventoryJournalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory Journal draft registered.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('INVENTORY', 'JOURNAL', 'create')
  @ApiOperation({ summary: 'Post an Inventory Journal draft to ledger entries' })
  @ApiParam({ name: 'id', description: 'Inventory Journal UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Inventory Journal posted to stock ledger.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('INVENTORY', 'JOURNAL', 'view')
  @ApiOperation({ summary: 'Fetch details of an Inventory Journal' })
  @ApiParam({ name: 'id', description: 'Inventory Journal UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Inventory Journal details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('INVENTORY', 'JOURNAL', 'view')
  @ApiOperation({ summary: 'List all Inventory Journals matching filters' })
  async findAll(@Query() query: QueryInventoryJournalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Inventory Journals retrieved successfully.',
      data: result
    };
  }
}
