import {
  Entity,
  EntityRepositoryType,
  Property,
  Unique,
} from '@mikro-orm/core';

import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';

import { Base } from '@domain/base';
import { ValidityUnit } from '@domain/enums/validity-unit.enums';

@Entity({ repository: () => RequisiteRepository })
export class Requisite extends Base {
  [EntityRepositoryType]?: RequisiteRepository;

  @Property()
  @Unique()
  name: string;

  @Property({ nullable: true })
  format?: string;

  @Property({ nullable: true, length: 500 })
  description?: string;

  @Property()
  isValidityRequired: boolean;

  @Property({ nullable: true })
  validityValue: number;

  @Property({ nullable: true })
  validityUnit: ValidityUnit;

  @Property({ default: true })
  isActive: boolean;
}
