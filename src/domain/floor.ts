import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';

import { FloorRepository } from '@infrastructure/repository/floor.repository';

import { Base } from '@domain/base';

@Entity({ repository: () => FloorRepository })
export class Floor extends Base {
  [EntityRepositoryType]?: FloorRepository;

  @Property({ unique: true, index: true })
  name: string;

  @Property()
  isActive: boolean;
}
