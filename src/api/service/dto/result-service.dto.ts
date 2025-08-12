import { ResultGroupDto } from '@/api/group/dto/result-group.dto';
import { ResultProfileDto } from '@/api/profile/dto/result-profile.dto';
import { ResultRequisiteDto } from '@/api/requisite/dto/result-requisite.dto';
import { Expose, Transform, Type } from 'class-transformer';

export class ResultServiceDto {
  @Expose()
  id: string;

  @Expose()
  category: string;

  @Expose()
  name: string;

  @Expose()
  code?: number;

  @Expose()
  costCenter: string;

  @Expose()
  qualificationDistinctiveNumber: string;

  @Expose()
  @Type(() => ResultGroupDto)
  group: ResultGroupDto;

  @Expose()
  @Type(() => ResultProfileDto)
  profiles: ResultProfileDto[];

  @Expose()
  locations: { floor: string; tower: string }[];

  @Expose()
  @Type(() => ResultRequisiteDto)
  requisites: ResultRequisiteDto[];

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  updatedAt: Date;

  @Expose()
  isActive: boolean;
}
