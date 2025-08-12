import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class Location {
  @Property()
  tower: string;

  @Property()
  floor: string;
}
