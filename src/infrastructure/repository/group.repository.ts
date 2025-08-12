import { EntityRepository } from '@mikro-orm/mongodb';

import { Group } from '@domain/group';

export class GroupRepository extends EntityRepository<Group> {}
