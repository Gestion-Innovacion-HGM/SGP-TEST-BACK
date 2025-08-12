import { EntityRepository } from '@mikro-orm/mongodb';

import { Requisite } from '@domain/requisite';

export class RequisiteRepository extends EntityRepository<Requisite> {}
