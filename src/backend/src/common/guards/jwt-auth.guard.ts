import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

// Stub guard - will be properly implemented in Week 51-52
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // Temporary: allow all requests
    return true;
  }
}
