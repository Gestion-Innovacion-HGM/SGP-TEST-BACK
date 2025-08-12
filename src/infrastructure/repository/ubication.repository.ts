import { EntityRepository } from '@mikro-orm/core';

import { Ubication } from '@domain/ubication';

export class UbicationRepository extends EntityRepository<Ubication> {}
