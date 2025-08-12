import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core';

import { ExpirationLogRepository } from '@infrastructure/repository/expiration-log.repository';

import { Base } from '@domain/base';

@Entity()
export class ExpirationLog extends Base {
  [EntityRepositoryType]?: ExpirationLogRepository;

  @Property()
  userId: string;

  @Property({ type: 'array' })
  documents: {
    documentName: string;
    idAttachment: string;
    expirationDate: Date;
    daysToExpiration: number;
  }[];
}
