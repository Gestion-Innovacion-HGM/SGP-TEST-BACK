import {
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToMany,
  Property,
} from '@mikro-orm/core';

import { HiringRepository } from '@infrastructure/repository/hiring.repository';

import { Base } from '@domain/base';
import { Requisite } from '@domain/requisite';

@Entity({ repository: () => HiringRepository })
export class Hiring extends Base {
  [EntityRepositoryType]?: HiringRepository;

  @Property()
  type: string;

  @ManyToMany(() => Requisite)
  requisites = new Collection<Requisite>(this);

  @Property({ default: true })
  isActive: boolean;
}
