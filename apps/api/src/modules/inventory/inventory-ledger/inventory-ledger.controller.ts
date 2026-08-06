import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryLedgerService } from './inventory-ledger.service';
import { QueryInventoryLedgerDto } from './dto/inventory-ledger.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

// Read-only: ledger rows are only ever written internally by document
// posting (Goods Receipt now; Issue/Transfer/Adjustment later), never via a
// direct create/update/delete endpoint here.
@ApiTags('Inventory Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-ledger')
export class InventoryLedgerController {
  constructor(private readonly ledgerService: InventoryLedgerService) {}

  @Get()
  @RequirePermission('INVENTORY', 'LEDGER', 'view')
  @ApiOperation({ summary: 'List Inventory Ledger entries matching filters' })
  async findAll(@Query() query: QueryInventoryLedgerDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.ledgerService.findAll(query, tenantId);
    return {
      success: true,
      message: 'Inventory ledger entries retrieved successfully.',
      data: result,
    };
  }
}
