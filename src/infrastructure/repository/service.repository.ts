import { EntityRepository } from '@mikro-orm/core';

import { Service } from '@domain/service';

export class ServiceRepository extends EntityRepository<Service> {}
