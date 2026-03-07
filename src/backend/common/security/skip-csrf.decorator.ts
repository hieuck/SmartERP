import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from './csrf.guard';

/**
 * Skip CSRF Protection Decorator
 *
 * Use this decorator to skip CSRF protection for specific endpoints:
 * - Public endpoints (login, register, etc.)
 * - Webhook endpoints
 * - API endpoints with other authentication mechanisms
 *
 * Example:
 * ```typescript
 * @Post('login')
 * @SkipCsrf()
 * async login(@Body() dto: LoginDto) {
 *   // ...
 * }
 * ```
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
