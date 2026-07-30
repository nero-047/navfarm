import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';

@ApiTags('User Management')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user account under a company' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User account created.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already exists.' })
  async create(@Body() body: CreateUserDto, @Req() req: any) {
    return this.userService.create(body, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users with optional filters' })
  async findAll(@Query() query: QueryUserDto, @Req() req: any) {
    return this.userService.findAll(query, req.user);
  }

  @Get('company/:companyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users belonging to a specific company' })
  @ApiParam({ name: 'companyId', description: 'Company UUID' })
  async findByCompany(@Param('companyId') companyId: string, @Req() req: any) {
    return this.userService.findByCompany(companyId, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch user details with assigned roles' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.userService.findById(id, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'edit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile details' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async update(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: any) {
    return this.userService.update(id, body, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermission('RBAC', 'USER', 'delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete / deactivate a user account' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.userService.remove(id, req.user);
  }
}
