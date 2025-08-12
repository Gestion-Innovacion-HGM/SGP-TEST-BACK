import { Expose, Transform } from 'class-transformer';

import { StatusAttachment } from '@domain/enums/attachment.enums';

export class ResultAttachmentDto {
  @Expose()
  filename: string;

  @Expose()
  status: StatusAttachment;

  @Expose()
  isActive: boolean;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  expeditionDate?: Date;

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
