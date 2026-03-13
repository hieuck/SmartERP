import { CacheModule } from '@common/cache/cache.module';
import { SecurityModule } from '@common/security/security.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
    UserModule,
    PassportModule,
    CacheModule,
    SecurityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    TokenBlacklistService,
    AccountLockoutService,
    TwoFactorAuthService,
  ],
  exports: [AuthService, JwtModule, TokenBlacklistService, AccountLockoutService],
})
export class AuthModule {}
