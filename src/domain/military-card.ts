import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class MilitaryCard {
  @Property()
  class: string;

  @Property()
  number: string;

  @Property()
  district: string;
}
