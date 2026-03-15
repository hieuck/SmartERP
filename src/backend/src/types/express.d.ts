import { User } from '../core/user/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        id: string;
        tenantId: string;
        userId?: string;
      };
      tenantId?: string;
    }
  }
}

export {};
