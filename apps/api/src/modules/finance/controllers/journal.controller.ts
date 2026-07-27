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
import { JournalService } from '../services/journal.service';
import { CreateJournalDto, QueryJournalDto } from '../dto/journal.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Financial Journals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @RequirePermission('FINANCE', 'JOURNAL', 'create')
  @ApiOperation({ summary: 'Register a new manual Financial Journal draft' })
  async create(@Body() dto: CreateJournalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.create(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Financial Journal registered as DRAFT.',
      data: result
    };
  }

  @Post(':id/post')
  @RequirePermission('FINANCE', 'JOURNAL', 'create')
  @ApiOperation({ summary: 'Post draft journal lines into General Ledger entries' })
  @ApiParam({ name: 'id', description: 'Financial Journal UUID' })
  async post(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.post(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Journal posted to General Ledger successfully.',
      data: result
    };
  }

  @Get(':id')
  @RequirePermission('FINANCE', 'JOURNAL', 'view')
  @ApiOperation({ summary: 'Retrieve details and lines of a specific Journal' })
  @ApiParam({ name: 'id', description: 'Journal UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.findOne(id, tenantId);
    return {
      success: true,
      message: 'Journal details retrieved.',
      data: result
    };
  }

  @Get()
  @RequirePermission('FINANCE', 'JOURNAL', 'view')
  @ApiOperation({ summary: 'List all manual journals matching filters' })
  async findAll(@Query() query: QueryJournalDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.journalService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Journals retrieved successfully.',
      data: result
    };
  }
}
