import { EntityRepository } from '@mikro-orm/mongodb';

import { Profile } from '@domain/profile';

export class ProfileRepository extends EntityRepository<Profile> {}
