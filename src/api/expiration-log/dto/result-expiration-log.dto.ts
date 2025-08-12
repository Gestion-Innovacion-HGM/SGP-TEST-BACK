import { Expose, Transform, Type } from 'class-transformer';

class ExpiringDocumentDto {
  @Expose()
  documentName: string;

  @Expose()
  idAttachment: string;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  expirationDate: Date;

  @Expose()
  daysToExpiration: number;
}

export class ResultExpirationLogDto {
  @Expose()
  userId: string;

  @Expose()
  @Type(() => ExpiringDocumentDto)
  documents: ExpiringDocumentDto[];

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  updatedAt: Date;
}
