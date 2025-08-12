import { Request } from 'express';

import { User } from '@domain/user';

export interface AuthenticatedRequest extends Request {
  user: User;
}
