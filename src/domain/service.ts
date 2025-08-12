import {
  Embedded,
  Entity,
  EntityRepositoryType,
  Enum,
  ManyToMany,
  OneToOne,
  Property,
} from '@mikro-orm/core';

import { ServiceRepository } from '@infrastructure/repository/service.repository';

import { Base } from '@domain/base';
import { Category } from '@domain/enums/category.enums';
import { Group } from '@domain/group';
import { Location } from '@domain/location';
import { Profile } from '@domain/profile';
import { Requisite } from '@domain/requisite';

@Entity({ repository: () => ServiceRepository })
export class Service extends Base {
  [EntityRepositoryType]?: ServiceRepository;

  @Enum(() => Category)
  category: Category;

  @Property({ nullable: true })
  code?: number;

  @Property()
  name: string;

  @Property()
  costCenter: string;

  @Property()
  qualificationDistinctiveNumber: string;

  @OneToOne(() => Group)
  group: Group;

  @ManyToMany(() => Profile)
  profiles: Profile[];

  @Embedded(() => Location, { array: true })
  locations: Location[] = [];

  @ManyToMany(() => Requisite)
  requisites: Requisite[];

  @Property({ default: true })
  isActive: boolean;
}
