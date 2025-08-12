import { Embeddable, Enum, OptionalProps, Property } from '@mikro-orm/core';

import { StatusAttachment } from '@domain/enums/attachment.enums';

@Embeddable()
export class Attachment {
  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @Property({ unique: true, index: true })
  filename: string;

  @Property({ default: StatusAttachment.PENDING })
  @Enum(() => StatusAttachment)
  status: StatusAttachment;

  @Property({ default: true })
  isActive: boolean;

  @Property({ nullable: true })
  expeditionDate?: Date;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
