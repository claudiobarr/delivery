import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  };
}
