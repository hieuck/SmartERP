import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { CacheService } from '@/common/cache/cache.service';
import { PermissionService, User } from '@/common/security/permission.service';
import { SecureRepository } from '@/common/security/secure-repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionPlan, Tenant, TenantStatus } from '../tenant/entities/tenant.entity';
import { User as UserEntity } from '../user/entities/user.entity';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class AuthService {
  private readonly secureUserRepo: SecureRepository<UserEntity>;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureUserRepo = new SecureRepository(
      this.userRepository,
      this.permissionService,
      'UserEntity',
    );
  }

  /**
   * Validate user credentials
   * Note: We don't cache validateUser because it involves password comparison
   * which should always be done fresh for security reasons
   * Note: Uses raw repo because this is called during login (no tenant context yet)
   * @param email User email
   * @param password Plain text password
   * @returns User object if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserEntity, 'password'> | null> {
    // Find user by email - use raw repo (no tenant context during login)
    const user = await this.userRepository.findOne({
      where: { email, status: 'active' },
    });

    if (!user) {
      return null;
    }

    // Compare password (always fresh for security)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
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
   * Note: Uses raw repo because we only have token, not full user context yet
   * @param refreshToken Refresh token
   * @returns New access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Get user from database - use raw repo (no tenant context from token alone)
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, status: 'active' },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newPayload = {
        email: user.email,
        sub: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
      };
    } catch (error) {
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
    success: boolean;
    data: {
      tenant: {
        id: string;
        name: string;
        subdomain: string;
        plan: SubscriptionPlan;
        trialEndsAt: Date;
      };
      user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
        emailVerified: boolean;
      };
      accessToken: string;
      refreshToken: string;
      emailVerificationToken: string;
    };
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
        success: true,
        data: {
          tenant: {
            id: savedTenant.id,
            name: savedTenant.name,
            subdomain: savedTenant.code,
            plan: savedTenant.subscriptionPlan,
            trialEndsAt: savedTenant.subscriptionEndDate,
          },
          user: {
            id: savedUser.id,
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            role: savedUser.role,
            emailVerified: savedUser.emailVerified,
          },
          accessToken,
          refreshToken,
          emailVerificationToken, // Send this via email in production
        },
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

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    // Find user by email - use raw repo (no user context during password reset)
    const user = await this.userRepository.findOne({
      where: { email, status: 'active' },
    });

    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await this.userRepository.save(user);

    const cacheKey = generateCacheKey('user-email', 'global', email);
    await this.cacheService.del(cacheKey);

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      resetToken,
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // Find user by token - use raw repo (no user context from token alone)
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    const cacheKey = generateCacheKey('user-email', 'global', user.email);
    await this.cacheService.del(cacheKey);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
