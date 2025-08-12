import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';

import { GroupRepository } from '@infrastructure/repository/group.repository';

import { Base } from '@domain/base';

@Entity({ repository: () => GroupRepository })
export class Group extends Base {
  [EntityRepositoryType]?: GroupRepository;

  @Property({ unique: true, index: true })
  name!: string;

  @Property({ default: true })
  isActive: boolean;
}
