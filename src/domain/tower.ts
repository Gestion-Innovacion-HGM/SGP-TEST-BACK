import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';

import { TowerRepository } from '@infrastructure/repository/tower.repository';

import { Base } from '@domain/base';

@Entity({ repository: () => TowerRepository })
export class Tower extends Base {
  [EntityRepositoryType]?: TowerRepository;

  @Property({ unique: true, index: true })
  name: string;

  @Property({ default: true })
  isActive: boolean;
}
