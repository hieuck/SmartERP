import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterTenantDto } from './dto/register-tenant.dto';

class LoginDto {
  email: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 registrations per hour
  @Post('register-tenant')
  @ApiOperation({
    summary: 'Register new tenant with admin user',
    description: 'Creates a new tenant (company) with an admin user. Includes 14-day free trial.',
  })
  @ApiBody({ type: RegisterTenantDto })
  async registerTenant(@Body() registerTenantDto: RegisterTenantDto) {
    return this.authService.registerTenant(registerTenantDto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 registrations per hour
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  async register(@Body() _body: unknown) {
    // TODO: Implement user registration
    return {
      message: 'Registration endpoint - to be implemented',
    };
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verifies user email using the token sent via email',
  })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  async logout(@Request() _req) {
    // In a stateless JWT system, logout is handled client-side
    // But we can return success to indicate the action
    return {
      message: 'Logged out successfully',
      statusCode: 200,
    };
  }
}
