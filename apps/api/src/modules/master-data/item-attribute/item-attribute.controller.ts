import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ItemAttributeService } from './item-attribute.service';
import { CreateItemAttributeDefinitionDto, SetItemAttributeValueDto } from './dto/item-attribute.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Item Attribute Master')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('item/attribute')
export class ItemAttributeController {
  constructor(private readonly svc: ItemAttributeService) {}

  @Post('definition')
  @RequirePermission('MASTER', 'ITEM_ATTRIBUTE', 'create')
  @ApiOperation({ summary: 'Define item attribute (e.g. PROTEIN_PCT, MOISTURE_PCT, BREED_GRADE)' })
  async createDefinition(@Body() dto: CreateItemAttributeDefinitionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.createDefinition(dto, tenantId);
    return { success: true, message: 'Item attribute definition created.', data: result };
  }

  @Get('definition')
  @RequirePermission('MASTER', 'ITEM_ATTRIBUTE', 'view')
  @ApiOperation({ summary: 'List all item attribute definitions for tenant' })
  async listDefinitions(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.listDefinitions(tenantId);
    return { success: true, message: 'Item attribute definitions retrieved.', data: result };
  }

  @Post(':itemId/value')
  @RequirePermission('MASTER', 'ITEM_ATTRIBUTE', 'edit')
  @ApiOperation({ summary: 'Set or update an attribute value for a specific item' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  async setAttributeValue(@Param('itemId') itemId: string, @Body() dto: SetItemAttributeValueDto) {
    const result = await this.svc.setAttributeValue(itemId, dto);
    return { success: true, message: 'Item attribute value set.', data: result };
  }

  @Get(':itemId')
  @RequirePermission('MASTER', 'ITEM_ATTRIBUTE', 'view')
  @ApiOperation({ summary: 'Get all attribute values for a specific item' })
  @ApiParam({ name: 'itemId', description: 'Item UUID' })
  async getItemAttributes(@Param('itemId') itemId: string) {
    const result = await this.svc.getItemAttributes(itemId);
    return { success: true, message: 'Item attributes retrieved.', data: result };
  }
}
