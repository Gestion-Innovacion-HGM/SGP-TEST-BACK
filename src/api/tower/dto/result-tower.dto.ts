import { Expose, Transform } from 'class-transformer';

export class ResultTowerDto {
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
  isActive: boolean;
}
