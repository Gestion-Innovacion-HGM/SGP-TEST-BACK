import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class IdDocument {
  @Property()
  type: string; // CC, CE, PA

  @Property()
  number: string;
}
