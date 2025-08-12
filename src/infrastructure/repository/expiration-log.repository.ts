import { EntityRepository } from '@mikro-orm/mongodb';

import { ExpirationLog } from '@domain/expiration-log';

export class ExpirationLogRepository extends EntityRepository<ExpirationLog> {}
