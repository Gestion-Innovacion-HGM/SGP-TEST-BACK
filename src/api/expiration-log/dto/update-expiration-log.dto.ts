import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class ExpiringDocumentUpdateDto {
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsString()
  @IsNotEmpty()
  idAttachment: string;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  expirationDate: Date;

  @Expose()
  daysToExpiration: number;
}

export class UpdateExpirationLogDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpiringDocumentUpdateDto)
  documents: ExpiringDocumentUpdateDto[];

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
