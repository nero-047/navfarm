import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHerdDto {
  @ApiProperty({ example: 'HERD-DAIRY-001' }) @IsString() @IsNotEmpty() herd_code: string;
  @ApiProperty({ example: 'Main Dairy Herd' }) @IsString() @IsNotEmpty() herd_name: string;
  @ApiProperty({ example: 'DAIRY', description: 'DAIRY/BEEF/MIXED/PIGGERY/GOAT/SHEEP' }) @IsString() @IsNotEmpty() herd_type: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() farm_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() species_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() location_id?: string;
  @ApiProperty({ example: 120, required: false }) @IsInt() @IsOptional() target_size?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() manager_name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
