// src/domain/ubication.ts
import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';

import { UbicationRepository } from '@infrastructure/repository/ubication.repository';

import { Base } from '@domain/base';

@Entity({ repository: () => UbicationRepository })
export class Ubication extends Base {
  [EntityRepositoryType]?: UbicationRepository;

  @Property()
  region: string;

  @Property()
  daneStateCode: number;

  @Property()
  state: string;

  @Property()
  daneMunicipalityCode: number;

  @Property()
  municipality: string;

  @Property({ default: true })
  isActive: boolean;
}
