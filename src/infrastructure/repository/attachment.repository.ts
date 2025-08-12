import { EntityRepository } from '@mikro-orm/mongodb';

import { Attachment } from '@domain/attachment';

export class AttachmentRepository extends EntityRepository<Attachment> {}
