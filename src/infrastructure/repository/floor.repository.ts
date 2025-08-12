import { EntityRepository } from '@mikro-orm/mongodb';

import { Floor } from '@domain/floor';

export class FloorRepository extends EntityRepository<Floor> {}
