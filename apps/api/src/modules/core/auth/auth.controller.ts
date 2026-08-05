import { Controller, Post, Get, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-admin')
  @ApiOperation({ summary: 'Register the initial Company Admin (Step 9 of setup)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Administrative account created successfully.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email address already exists.' })
  async registerAdmin(
    @Body() dto: RegisterAdminDto,
    @Request() req,
  ) {
    const authHeader = req?.headers?.authorization;
    return this.authService.registerAdmin(dto, authHeader);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users in the active tenant workspace' })
  async listUsers(@Request() req) {
    return this.authService.listUsers(req.user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful (tokens returned) or MFA required.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid email or password.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new access + refresh token pair' })
  @ApiResponse({ status: HttpStatus.OK, description: 'New tokens issued.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired refresh token.' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Post('mfa/verify')
  @ApiOperation({ summary: 'Verify 6-digit MFA TOTP code to complete login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'MFA verified and tokens returned.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid code.' })
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(dto);
  }

  @Post('mfa/qr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate and retrieve TOTP secret and QR code URI' })
  async generateMfaQr(@Request() req) {
    return this.authService.generateMfaQr(req.user.userId, req.user.email);
  }
}
