import { JwtService } from '@nestjs/jwt';

export class AuthTestHelper {
  private static jwtService: JwtService;

  static initialize() {
    this.jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'test-secret-key',
      signOptions: { expiresIn: '1h' },
    });
  }

  static generateToken(payload: any): string {
    if (!this.jwtService) {
      this.initialize();
    }
    return this.jwtService.sign(payload);
  }

  static generateUserToken(userId: string, tenantId: string, roles: string[] = ['user']): string {
    return this.generateToken({
      sub: userId,
      tenantId,
      roles,
      type: 'access',
    });
  }

  static generateAdminToken(userId: string, tenantId: string): string {
    return this.generateToken({
      sub: userId,
      tenantId,
      roles: ['admin'],
      type: 'access',
    });
  }

  static verifyToken(token: string): any {
    if (!this.jwtService) {
      this.initialize();
    }
    return this.jwtService.verify(token);
  }

  static async createAuthenticatedUser(app: any): Promise<{ token: string; user: any }> {
    const userRepository = app.get('UserRepository');
    const tenantRepository = app.get('TenantRepository');

    // Create tenant
    const tenant = tenantRepository.create({
      name: 'Test Tenant',
      subdomain: `test-${Date.now()}`,
      isActive: true,
    });
    await tenantRepository.save(tenant);

    // Create user
    const user = userRepository.create({
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      tenantId: tenant.id,
      roles: ['user'],
      isActive: true,
    });
    await userRepository.save(user);

    const token = this.generateUserToken(user.id, tenant.id);

    return { token, user };
  }
}
