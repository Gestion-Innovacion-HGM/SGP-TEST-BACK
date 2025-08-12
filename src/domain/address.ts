import { Embeddable, Property } from '@mikro-orm/core';

import {
  BlockOrInterior,
  PropertyType,
  TypeOfRoad,
} from '@domain/enums/address.enums';

@Embeddable()
export class Address {
  @Property()
  state: string;

  @Property()
  municipality: string;

  @Property()
  neighborhood: string;

  @Property()
  typeOfRoad: TypeOfRoad;

  @Property({ nullable: true })
  firstAddressField: string;

  @Property({ nullable: true })
  secondAddressField: string;

  @Property({ nullable: true })
  thirdAddressField: string;

  @Property({ nullable: true })
  propertyType?: PropertyType;

  @Property({ nullable: true })
  namePropertyType?: string;

  @Property({ nullable: true })
  blockOrInterior?: BlockOrInterior;

  @Property({ nullable: true })
  blockOrInteriorName?: string;

  @Property({ nullable: true })
  observation?: string;

  @Property({ default: true })
  isActive: boolean;
}
