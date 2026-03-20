import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AccountLockoutService } from './services/account-lockout.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

class LoginDto {
  email: string;
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly SESSION_HINT_COOKIE = 'session_hint';

  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly accountLockoutService: AccountLockoutService,
  ) {}

  private setSessionCookies(res: ExpressResponse, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie(this.SESSION_HINT_COOKIE, '1', {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearSessionCookies(res: ExpressResponse) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    });
    res.clearCookie(this.SESSION_HINT_COOKIE, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
    });
  }

  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for testing
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req, @Res({ passthrough: true }) res: ExpressResponse) {
    const email = req.user?.email;

    // Check if account is locked
    const isLocked = await this.accountLockoutService.isAccountLocked(email);
    if (isLocked) {
      const remainingTime = await this.accountLockoutService.getRemainingLockoutTime(email);
      this.logger.warn(`Login attempt to locked account: ${email}`);
      throw new UnauthorizedException(`Account is locked. Try again in ${remainingTime} seconds.`);
    }

    // Reset failed attempts on successful login
    await this.accountLockoutService.resetAttempts(email);

    const result = await this.authService.login(req.user);

    this.setSessionCookies(res, result.refreshToken);

    const response = { ...result };
    delete response.refreshToken;
    return response;
  }

  @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 registrations per hour for testing
  @Post('register-tenant')
  @ApiOperation({
    summary: 'Register new tenant with admin user',
    description: 'Creates a new tenant (company) with an admin user. Includes 14-day free trial.',
  })
  @ApiBody({ type: RegisterTenantDto })
  async registerTenant(
    @Body() registerTenantDto: RegisterTenantDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const response = await this.authService.registerTenant(registerTenantDto);
    this.setSessionCookies(res, response.refreshToken);
    return response;
  }

  @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 registrations per hour for testing
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const response = await this.authService.registerTenant({
      companyName: registerDto.companyName,
      subdomain: registerDto.companyName.toLowerCase().replace(/\s+/g, '-'),
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.fullName.split(' ')[0],
      lastName: registerDto.fullName.split(' ').slice(1).join(' '),
      phone: registerDto.phone,
    });
    this.setSessionCookies(res, response.refreshToken);
    return response;
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
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  async logout(@Request() req, @Res({ passthrough: true }) res: ExpressResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Decode token to get expiration time
        const decoded = this.authService.decodeToken(token);
        if (decoded && decoded.exp) {
          const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
          if (expiresIn > 0) {
            // Revoke token by adding to blacklist
            await this.tokenBlacklistService.revokeToken(token, expiresIn);
            this.logger.log(`Token revoked for user: ${decoded.sub}`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to revoke token on logout: ${error.message}`);
      }
    }

    this.clearSessionCookies(res);

    return {
      message: 'Logged out successfully',
      statusCode: 200,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    // Validate token format
    if (!resetPasswordDto.token || resetPasswordDto.token.length < 36) {
      throw new BadRequestException('Invalid reset token format');
    }

    // Validate password strength
    if (!resetPasswordDto.newPassword || resetPasswordDto.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto, required: false })
  async refresh(@Request() req, @Body() refreshTokenDto?: RefreshTokenDto) {
    // Accept refresh token from httpOnly cookie (preferred) or request body (fallback)
    const token = req.cookies?.refreshToken || refreshTokenDto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token not provided');
    }
    return this.authService.refreshToken(token);
  }
}
