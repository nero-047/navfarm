import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePlanDto {
  @ApiProperty({ 
    example: 'PLAN_PRO', 
    description: 'The Plan Code to subscribe to' 
  })
  @IsString()
  @IsNotEmpty()
  plan_id: string;
}
