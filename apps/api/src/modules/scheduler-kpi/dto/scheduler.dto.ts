import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchedulerJobDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'Daily Feed Reminder Trigger' })
  @IsString()
  @IsNotEmpty()
  job_name: string;

  @ApiProperty({ example: 'OPERATIONAL', default: 'OPERATIONAL' })
  @IsString()
  @IsOptional()
  job_group?: string;

  @ApiProperty({ example: '0 8 * * *', description: 'Standard 5-part cron expression' })
  @IsString()
  @IsNotEmpty()
  cron_expression: string;

  @ApiProperty({ example: 'OperationalScheduleService' })
  @IsString()
  @IsNotEmpty()
  target_service: string;

  @ApiProperty({ example: 'triggerDailyFeedDispatch' })
  @IsString()
  @IsNotEmpty()
  target_method: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;
}
