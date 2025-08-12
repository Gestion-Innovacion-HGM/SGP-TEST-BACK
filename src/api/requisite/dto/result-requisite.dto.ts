import { ValidityUnit } from '@/domain/enums/validity-unit.enums';
import { Expose, Transform } from 'class-transformer';

export class ResultRequisiteDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  format?: string;

  @Expose()
  isValidityRequired: boolean;

  @Expose()
  validityValue?: number;

  @Expose()
  validityUnit?: ValidityUnit;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  updatedAt: Date;

  @Expose()
  isActive: boolean;
}
