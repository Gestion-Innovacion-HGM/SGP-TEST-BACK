import { Embeddable, Embedded, Enum, Property } from '@mikro-orm/core';

import { Attachment } from '@domain/attachment';
import { State } from '@domain/enums/state.enums';

@Embeddable()
export class Document {
  @Property()
  name: string;

  @Enum(() => State)
  state: State;

  @Property({ default: true })
  isActive: boolean;

  @Property({ nullable: true })
  format?: string;

  @Property({ nullable: true, length: 500 })
  description?: string;

  @Embedded(() => Attachment, { array: true })
  attachments: Attachment[] = [];

  @Property()
  hasExpiration: boolean;

  @Property()
  expirationDate? = new Date();

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ nullable: true, length: 500 })
  rejectionMessage?: string;
}
