import { Expose, Transform, Type } from 'class-transformer';

import { ResultRequisiteDto } from '@api/requisite/dto/result-requisite.dto';

export class ResultProfileDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  updatedAt: Date;

  @Expose()
  @Type(() => ResultRequisiteDto)
  requisites: ResultRequisiteDto[];

  @Expose()
  isActive: boolean;
}
