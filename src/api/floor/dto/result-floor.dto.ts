import { Expose, Transform } from 'class-transformer';

export class ResultFloorDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toClassOnly: true })
  updatedAt: Date;
}
