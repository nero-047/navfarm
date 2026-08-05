import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserCompanyService } from './user-company.service';
import { AssignUserCompanyDto } from './dto/user-company.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Multi-Company User Assignments')
@Controller('user-company')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserCompanyController {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  private assertAdministrator(user: { userType?: string }) {
    if (!['SYSTEM_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN'].includes(user.userType || '')) {
      throw new ForbiddenException('Administrator access is required to manage company assignments.');
    }
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assign a user to an additional company' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User assigned to company.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already assigned to this company.' })
  async assign(@Body() dto: AssignUserCompanyDto, @Request() req) {
    this.assertAdministrator(req.user);
    return this.userCompanyService.assignUserToCompany(
      dto.userId,
      dto.companyId,
      req.user.userId,
      dto.isPrimary ?? false,
    );
  }

  @Delete('assign/:assignId')
  @ApiOperation({ summary: 'Remove a user from a company (cannot remove last company)' })
  @ApiParam({ name: 'assignId', description: 'Assignment UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User removed from company.' })
  async remove(@Param('assignId') assignId: string, @Request() req) {
    this.assertAdministrator(req.user);
    return this.userCompanyService.removeUserFromCompany(assignId);
  }

  @Get(':userId/companies')
  @ApiOperation({ summary: 'List all companies a user is assigned to' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  async getUserCompanies(@Param('userId') userId: string, @Request() req) {
    if (req.user.userId !== userId) this.assertAdministrator(req.user);
    return this.userCompanyService.getUserCompanies(userId);
  }

  @Get('company/:companyId/members')
  @ApiOperation({ summary: 'List all users assigned to a company via junction table' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async getCompanyMembers(@Param('companyId') companyId: string, @Request() req) {
    this.assertAdministrator(req.user);
    return this.userCompanyService.getCompanyMembers(companyId);
  }
}
