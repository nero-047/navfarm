import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step2AddressDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'REGISTERED', description: 'Address type classification: REGISTERED / BILLING / SHIPPING / FARM' })
  @IsString()
  @IsNotEmpty()
  address_type: string;

  @ApiProperty({ example: 'Suite 201, Farms Road', description: 'Address line 1' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  line1: string;

  @ApiProperty({ example: 'Near Highway Crossing', description: 'Address line 2', required: false })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty({ example: 'Delhi', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Haryana', description: 'State name or code' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 36)
  state_id: string;

  @ApiProperty({ example: 'India', description: 'Country name or code' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 36)
  country_id: string;

  @ApiProperty({ example: '110001', description: 'Postal/Zip code' })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({ example: 28.6139, description: 'GPS coordinates latitude', required: false })
  @IsNumber()
  @IsOptional()
  gps_latitude?: number;

  @ApiProperty({ example: 77.2090, description: 'GPS coordinates longitude', required: false })
  @IsNumber()
  @IsOptional()
  gps_longitude?: number;
}
