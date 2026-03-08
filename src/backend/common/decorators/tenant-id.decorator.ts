import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Stub decorator - will be properly implemented in Week 51-52
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId || 'default';
  },
);
