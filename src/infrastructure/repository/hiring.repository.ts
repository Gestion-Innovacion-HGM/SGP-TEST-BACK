import { EntityRepository } from '@mikro-orm/mongodb';

import { Hiring } from '@domain/hiring';

export class HiringRepository extends EntityRepository<Hiring> {}
