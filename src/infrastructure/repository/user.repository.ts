import { EntityRepository } from '@mikro-orm/core';

import { User } from '@domain/user';

export class UserRepository extends EntityRepository<User> {}
