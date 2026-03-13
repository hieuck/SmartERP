import { CacheTTL, generateCacheKey } from '@common/cache/cache.config';
import { CacheService } from '@common/cache/cache.service';
import { PermissionService, User } from '@common/security/permission.service';
import { SecureRepository } from '@common/security/secure-repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionPlan } from '../tenant/enums/subscription-plan.enum';
import { TenantStatus } from '../tenant/enums/tenant-status.enum';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User as UserEntity } from '../user/entities/user.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { AccountLockoutService } from './services/account-lockout.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly secureUserRepo: SecureRepository<UserEntity>;
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly accountLockoutService: AccountLockoutService,
  ) {
    this.secureUserRepo = new SecureRepository(
      this.userRepository,
      this.permissionService,
      'UserEntity',
    );
  }

  /**
   * Validate user credentials with security checks
   * - Checks account lockout status
   * - Verifies tenant is active
   * - Records failed attempts
   * - Validates password
   * @param email User email
   * @param password Plain text password
   * @returns User object if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserEntity, 'password'> | null> {
    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if account is locked (CRITICAL FIX #14)
    const isLocked = await this.accountLockoutService.isAccountLocked(sanitizedEmail);
    if (isLocked) {
      const remainingTime =
        await this.accountLockoutService.getRemainingLockoutTime(sanitizedEmail);
      this.logger.warn('Login attempt on locked account', {
        email: sanitizedEmail,
        remainingLockoutTime: remainingTime,
      });
      return null;
    }

    // Find user by email - use raw repo (no tenant context during login)
    const user = await this.userRepository.findOne({
      where: { email: sanitizedEmail, status: 'active' },
      relations: ['tenant'],
    });

    if (!user) {
      // Record failed attempt for account lockout
      await this.accountLockoutService.recordFailedAttempt(sanitizedEmail);
      this.logger.warn('Login attempt with non-existent email', { email: sanitizedEmail });
      return null;
    }

    // CRITICAL FIX #7: Verify tenant is active before allowing login
    if (!user.tenant || user.tenant.status !== TenantStatus.ACTIVE) {
      await this.accountLockoutService.recordFailedAttempt(sanitizedEmail);
      this.logger.warn('Login attempt to inactive tenant', {
        userId: user.id,
        tenantStatus: user.tenant?.status,
      });
      return null;
    }

    // Compare password (always fresh for security)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Record failed attempt for account lockout
      await this.accountLockoutService.recordFailedAttempt(sanitizedEmail);
      this.logger.warn('Failed login attempt', {
        email: sanitizedEmail,
        userId: user.id,
        tenantId: user.tenantId,
      });
      return null;
    }

    // Reset failed attempts on successful login
    await this.accountLockoutService.resetAttempts(sanitizedEmail);

    // Log successful login
    this.logger.log('User login successful', {
      userId: user.id,
      email: sanitizedEmail,
      tenantId: user.tenantId,
    });

    // Return user without password
    const { password: _password, ...result } = user;
    return result;
  }

  /**
   * Login user and generate JWT token
   * @param user User object from validateUser
   * @returns Access token and user info with tenantId
   */
  async login(user: Omit<UserEntity, 'password'>) {
    // Create JWT payload with tenantId
    const payload = {
      email: user.email,
      sub: user.id,
      userId: user.id,
      tenantId: user.tenantId, // ← CRITICAL: Include tenantId in JWT
      role: user.role,
    };

    // Generate JWT token
    const accessToken = this.jwtService.sign(payload);

    // Return token and user info
    return {
      token: accessToken, // ← Changed from access_token to token (match E2E tests)
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId, // ← CRITICAL: Return tenantId to client
        role: user.role,
      },
    };
  }

  /**
   * Hash password using bcrypt
   * Security: Using 12 rounds (recommended minimum for production)
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const SALT_ROUNDS = 12; // Minimum 10, recommended 12 for production
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Decode JWT token without verification (for logout)
   * @param token JWT token
   * @returns Decoded token payload
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.error('Failed to decode token', { error: error.message });
      return null;
    }
  }

  /**
   * Compare plain password with hashed password
   * @param password Plain text password
   * @param hash Hashed password
   * @returns True if match, false otherwise
   */
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register new user with tenant
   * @param data Registration data
   * @param currentUser User creating the new user (admin)
   * @returns Access token and refresh token
   */
  async register(
    data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      tenantId: string;
    },
    currentUser: User,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      tenantId: string;
      role: string;
    };
  }> {
    // Check if user already exists in tenant
    const existingUser = await this.secureUserRepo.findOne(currentUser, {
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user with SecureRepository
    const user = {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      tenantId: data.tenantId,
      role: 'user',
      status: 'active',
    } as UserEntity;

    // Save user to database
    const savedUser = await this.secureUserRepo.save(currentUser, user);

    // Invalidate email cache
    const cacheKey = generateCacheKey('user-email', 'global', data.email);
    await this.cacheService.del(cacheKey);

    // Generate tokens
    const payload = {
      email: savedUser.email,
      sub: savedUser.id,
      userId: savedUser.id,
      tenantId: savedUser.tenantId,
      role: savedUser.role,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign({ sub: savedUser.id }, { expiresIn: '7d' }),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        tenantId: savedUser.tenantId,
        role: savedUser.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * CRITICAL FIX #2: Add token expiration validation
   * CRITICAL FIX #1: Check if token is revoked
   * Note: Uses raw repo because we only have token, not full user context yet
   * @param refreshToken Refresh token
   * @returns New access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token signature
      const payload = this.jwtService.verify(refreshToken);

      // CRITICAL FIX #2: Check if token is actually expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn('Refresh token has expired', { userId: payload.sub });
        throw new UnauthorizedException('Refresh token has expired');
      }

      // CRITICAL FIX #1: Check if token was revoked
      const isRevoked = await this.tokenBlacklistService.isTokenRevoked(refreshToken);
      if (isRevoked) {
        this.logger.warn('Attempt to use revoked refresh token', { userId: payload.sub });
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Get user from database - use raw repo (no tenant context from token alone)
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, status: 'active' },
        relations: ['tenant'],
      });

      if (!user) {
        this.logger.warn('User not found for token refresh', { userId: payload.sub });
        throw new UnauthorizedException('User not found');
      }

      // Verify tenant is still active
      if (!user.tenant || user.tenant.status !== TenantStatus.ACTIVE) {
        this.logger.warn('Token refresh for inactive tenant', {
          userId: user.id,
          tenantStatus: user.tenant?.status,
        });
        throw new UnauthorizedException('Tenant is no longer active');
      }

      // Generate new access token
      const newPayload = {
        email: user.email,
        sub: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      };

      this.logger.log('Token refreshed successfully', {
        userId: user.id,
        tenantId: user.tenantId,
      });

      return {
        accessToken: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token refresh failed', { error: error.message });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Find user by email (for login)
   * Note: Uses raw repo because this is called during login (no tenant context yet)
   * @param email User email
   * @returns User object or null
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const cacheKey = generateCacheKey('user-email', 'global', email);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.userRepository.findOne({
          where: { email, status: 'active' },
        });
      },
      CacheTTL.SHORT, // Use SHORT TTL (5 min) for auth data
    );
  }

  /**
   * Register new tenant with admin user
   * @param registerTenantDto Registration data
   * @returns Tenant, user, and access tokens
   */
  async registerTenant(registerTenantDto: RegisterTenantDto): Promise<{
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      tenantId: string;
      role: string;
    };
    token: string;
    refreshToken: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if subdomain already exists
      const existingTenant = await queryRunner.manager.findOne(Tenant, {
        where: { code: registerTenantDto.subdomain },
      });

      if (existingTenant) {
        throw new ConflictException(`Subdomain "${registerTenantDto.subdomain}" is already taken`);
      }

      // Check if email already exists
      const existingUser = await queryRunner.manager.findOne(UserEntity, {
        where: { email: registerTenantDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create tenant with trial plan (14 days)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const tenant = queryRunner.manager.create(Tenant, {
        code: registerTenantDto.subdomain,
        name: registerTenantDto.companyName,
        companyName: registerTenantDto.companyName,
        companyPhone: registerTenantDto.phone,
        status: TenantStatus.ACTIVE,
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: trialEndDate,
        maxUsers: 5,
        maxStorage: 1073741824, // 1GB
        currentStorage: 0,
        features: ['basic'],
        createdBy: 'system',
        updatedBy: 'system',
      });

      const savedTenant = await queryRunner.manager.save(tenant);

      // Hash password
      const hashedPassword = await this.hashPassword(registerTenantDto.password);

      // Generate email verification token
      const emailVerificationToken = uuidv4();

      // Create admin user
      const user = queryRunner.manager.create(UserEntity, {
        email: registerTenantDto.email,
        password: hashedPassword,
        firstName: registerTenantDto.firstName,
        lastName: registerTenantDto.lastName,
        phone: registerTenantDto.phone,
        tenantId: savedTenant.id,
        role: 'admin',
        status: 'active',
        emailVerified: false,
        emailVerificationToken,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Invalidate email cache
      const cacheKey = generateCacheKey('user-email', 'global', registerTenantDto.email);
      await this.cacheService.del(cacheKey);

      // Generate JWT tokens
      const payload = {
        email: savedUser.email,
        sub: savedUser.id,
        userId: savedUser.id,
        tenantId: savedUser.tenantId,
        role: savedUser.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign({ sub: savedUser.id }, { expiresIn: '7d' });

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          tenantId: savedUser.tenantId,
          role: savedUser.role,
        },
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Verify user email
   * Note: Uses raw repo because we only have token, not user context yet
   * @param token Email verification token
   * @returns Success message
   */
  async verifyEmail(token: string): Promise<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      email: string;
      emailVerified: boolean;
    };
  }> {
    // Find user by token - use raw repo (no user context from token alone)
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerified) {
      return {
        success: true,
        message: 'Email already verified',
      };
    }

    // Update user - use raw repo
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Request password reset with constant-time response
   * CRITICAL FIX #8: Prevent account enumeration via timing attacks
   * @param email User email
   * @returns Generic success message (same timing regardless of email existence)
   */
  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    const startTime = Date.now();
    const CONSTANT_TIME_MS = 500; // Constant response time

    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    // Find user by email - use raw repo (no user context during password reset)
    const user = await this.userRepository.findOne({
      where: { email: sanitizedEmail, status: 'active' },
    });

    if (user) {
      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await this.userRepository.save(user);

      // Invalidate email cache
      const cacheKey = generateCacheKey('user-email', 'global', sanitizedEmail);
      await this.cacheService.del(cacheKey);

      this.logger.log('Password reset requested', {
        userId: user.id,
        email: sanitizedEmail,
      });

      // In production, send email here
      // await this.emailService.sendPasswordReset(user.email, resetToken);
    } else {
      this.logger.warn('Password reset requested for non-existent email', {
        email: sanitizedEmail,
      });
    }

    // CRITICAL FIX #8: Constant-time response to prevent timing attacks
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < CONSTANT_TIME_MS) {
      await new Promise((resolve) => setTimeout(resolve, CONSTANT_TIME_MS - elapsedTime));
    }

    // Return generic message (same for existing and non-existing emails)
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  /**
   * Validate password strength
   * Requirements: 8+ chars, uppercase, lowercase, digit
   * @param password Password to validate
   * @throws BadRequestException if password is weak
   */
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < this.PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters`,
      );
    }

    if (!this.PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Password must contain uppercase, lowercase, and numeric characters',
      );
    }
  }

  /**
   * Reset password with security validations
   * CRITICAL FIX #3: Add tenant verification
   * CRITICAL FIX #6: Add password strength validation
   * @param token Password reset token
   * @param newPassword New password
   * @param tenantId Optional tenant ID for verification
   * @returns Success message
   */
  async resetPassword(
    token: string,
    newPassword: string,
    tenantId?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Validate token format (CRITICAL FIX #10)
    if (!token || token.length < 36) {
      this.logger.warn('Invalid reset token format attempted');
      throw new BadRequestException('Invalid reset token format');
    }

    // Validate password strength (CRITICAL FIX #6)
    this.validatePasswordStrength(newPassword);

    // Find user by token - use raw repo (no user context from token alone)
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
      relations: ['tenant'],
    });

    if (!user) {
      this.logger.warn('Password reset attempted with invalid token');
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check token expiration
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      this.logger.warn('Password reset attempted with expired token', {
        userId: user.id,
        tokenExpiry: user.resetPasswordExpires,
      });
      throw new BadRequestException('Reset token has expired');
    }

    // CRITICAL FIX #3: Verify tenant context if provided
    if (tenantId && user.tenantId !== tenantId) {
      this.logger.error('Cross-tenant password reset attempt detected', {
        userId: user.id,
        requestedTenantId: tenantId,
        userTenantId: user.tenantId,
      });
      throw new UnauthorizedException('Tenant mismatch');
    }

    // Verify tenant is still active
    if (!user.tenant || user.tenant.status !== TenantStatus.ACTIVE) {
      this.logger.warn('Password reset for inactive tenant', {
        userId: user.id,
        tenantStatus: user.tenant?.status,
      });
      throw new UnauthorizedException('Tenant is no longer active');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    // Invalidate email cache
    const cacheKey = generateCacheKey('user-email', 'global', user.email);
    await this.cacheService.del(cacheKey);

    // Revoke all existing tokens for this user (security best practice)
    await this.tokenBlacklistService.revokeUserTokens(user.id);

    this.logger.log('Password reset successfully', {
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
