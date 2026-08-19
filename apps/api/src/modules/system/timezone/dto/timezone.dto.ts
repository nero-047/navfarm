import { ApiProperty } from '@nestjs/swagger';

export class CreateTimezoneDto {
  @ApiProperty({ description: 'IANA timezone code', example: 'Asia/Kolkata' })
  tz_code: string;

  @ApiProperty({ description: 'Display name', example: 'India Standard Time' })
  tz_name: string;

  @ApiProperty({ description: 'UTC offset string', example: '+05:30' })
  utc_offset: string;

  @ApiProperty({ description: 'UTC offset in minutes', example: 330 })
  offset_minutes: number;

  @ApiProperty({ description: 'Observes daylight saving time', default: false, required: false })
  is_dst?: boolean;
}

export class UpdateTimezoneDto {
  @ApiProperty({ required: false })
  tz_code?: string;

  @ApiProperty({ required: false })
  tz_name?: string;

  @ApiProperty({ required: false })
  utc_offset?: string;

  @ApiProperty({ required: false })
  offset_minutes?: number;

  @ApiProperty({ required: false })
  is_dst?: boolean;

  @ApiProperty({ required: false })
  is_active?: boolean;
}
