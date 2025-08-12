import {
  ArrayType,
  Embedded,
  Entity,
  EntityRepositoryType,
  Enum,
  Property,
} from '@mikro-orm/core';

import { UserRepository } from '@infrastructure/repository/user.repository';

import { Account } from '@domain/account';
import { Address } from '@domain/address';
import { Base } from '@domain/base';
import { Role } from '@domain/enums/role.enums';
import { Folder } from '@domain/folder';
import { IdDocument } from '@domain/id-document';
import { MilitaryCard } from '@domain/military-card';

@Entity({ repository: () => UserRepository })
export class User extends Base {
  [EntityRepositoryType]?: UserRepository;

  @Property()
  firstName: string;

  @Property({ nullable: true })
  secondName?: string;

  @Property()
  surname: string;

  @Property({ nullable: true })
  secondSurname?: string;

  @Property()
  email: string;

  @Property()
  birthdate: string;

  @Property()
  sex: string;

  @Embedded(() => IdDocument)
  idDocument: IdDocument;

  @Embedded(() => MilitaryCard, { nullable: true })
  militaryCard?: MilitaryCard;

  @Property({ type: ArrayType })
  @Enum(() => Role)
  roles: Role[];

  @Embedded(() => Account)
  account: Account;

  @Embedded(() => Address)
  address: Address;

  @Embedded(() => Folder)
  folder: Folder;

  @Property({ default: true })
  isActive: boolean;

  /**
   * Checks if the user has a specific role.
   * @param role - The role to check for.
   * @returns {boolean} True if the user has the role, otherwise false.
   */
  is(role: Role): boolean {
    return this.roles.includes(role);
  }
}
