import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class InventoryQueryDto {
  @ApiProperty({ description: 'Filter by Item UUID', required: false })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @ApiProperty({ description: 'Filter by Warehouse UUID', required: false })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @ApiProperty({ description: 'Filter by Location UUID', required: false })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ description: 'Filter by Lot UUID', required: false })
  @IsUUID()
  @IsOptional()
  lotId?: string;

  @ApiProperty({ description: 'Filter by Serial UUID', required: false })
  @IsUUID()
  @IsOptional()
  serialId?: string;
}

export class ValuationQueryDto {
  @ApiProperty({ description: 'Company UUID scope', required: true })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Filter by Item UUID', required: false })
  @IsUUID()
  @IsOptional()
  itemId?: string;

  @ApiProperty({ description: 'Filter by Warehouse UUID', required: false })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;
}
