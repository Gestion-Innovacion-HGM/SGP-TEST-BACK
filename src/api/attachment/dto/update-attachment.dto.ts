import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';

import { StatusAttachment } from '@domain/enums/attachment.enums';

export class UpdateAttachmentDto {
  @IsOptional()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  filename?: string;

  @IsOptional()
  @IsEnum(StatusAttachment, {
    message: 'El estado debe ser uno de los valores válidos.',
  })
  status?: StatusAttachment;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida.' },
  )
  expeditionDate?: Date;
}
