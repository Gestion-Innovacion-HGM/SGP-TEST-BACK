import { Expose, Transform } from 'class-transformer';

export class ResultUbicationDto {
  @Expose()
  id: string;

  @Expose()
  region: string;

  @Expose()
  daneStateCode: number;

  @Expose()
  state: string;

  @Expose()
  daneMunicipalityCode: number;

  @Expose()
  municipality: string;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  updatedAt: Date;

  @Expose()
  isActive: boolean;
}
