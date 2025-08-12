import { Expose, Transform, Type } from 'class-transformer';

import { ResultAttachmentDto } from '@api/attachment/dto/result-attachment.dto';

import { State } from '@domain/enums/state.enums';

export class ResultDocumentDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => State as any)
  state: State;

  @Expose()
  isActive: boolean;

  @Expose()
  format?: string;

  @Expose()
  description?: string;

  @Expose()
  @Expose()
  @Type(() => ResultAttachmentDto)
  attachments: ResultAttachmentDto[];

  @Expose()
  hasExpiration: boolean;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  expirationDate?: Date;

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

  @Expose()
  rejectionMessage?: string;
}
