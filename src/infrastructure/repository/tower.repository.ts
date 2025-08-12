import { EntityRepository } from '@mikro-orm/mongodb';

import { Tower } from '@domain/tower';

export class TowerRepository extends EntityRepository<Tower> {}
