import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';

import { StatusAttachment } from '@domain/enums/attachment.enums';

export class CreateAttachmentDto {
  @IsNotEmpty()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  filename: string;

  @IsNotEmpty()
  @IsEnum(StatusAttachment, {
    message: 'El estado debe ser uno de los valores válidos.',
  })
  status: StatusAttachment;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de expedición debe ser una fecha válida.' },
  )
  expeditionDate?: Date;
}
