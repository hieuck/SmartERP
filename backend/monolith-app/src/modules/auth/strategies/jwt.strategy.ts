import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Validate JWT_SECRET exists and is strong
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters for security');
    }
    if (jwtSecret === 'your-secret-key') {
      throw new Error('JWT_SECRET cannot be the default value. Please set a strong secret.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Validate required fields in payload
    if (!payload.sub || !payload.email || !payload.tenantId || !payload.role) {
      throw new UnauthorizedException('Invalid token payload: missing required fields');
    }

    // Verify user still exists and is active
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'tenantId', 'role', 'status'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify payload data matches current user state
    if (user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch');
    }

    if (user.role !== payload.role) {
      throw new UnauthorizedException('Token role mismatch - please login again');
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
  }
}
