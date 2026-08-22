import { IsString, IsNotEmpty, IsBoolean, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferenceLineDto {
  @ApiProperty({ example: 'APPROVALS' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  email_enabled: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  in_app_enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({ type: [NotificationPreferenceLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceLineDto)
  preferences: NotificationPreferenceLineDto[];
}
