import {
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToMany,
  Property,
} from '@mikro-orm/core';

import { ProfileRepository } from '@infrastructure/repository/profile.repository';

import { Base } from '@domain/base';
import { Requisite } from '@domain/requisite';

@Entity({ repository: () => ProfileRepository })
export class Profile extends Base {
  [EntityRepositoryType]?: ProfileRepository;

  @Property()
  name: string;

  @ManyToMany(() => Requisite)
  requisites = new Collection<Requisite>(this);

  @Property({ default: true })
  isActive: boolean;
}
