import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateAttachmentDto } from '@api/attachment/dto/create-attachment.dto';

import { State } from '@domain/enums/state.enums';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(State)
  state: State;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsOptional()
  format?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttachmentDto)
  attachments: CreateAttachmentDto[];

  @IsBoolean()
  hasExpiration: boolean;

  @IsOptional()
  @IsDateString()
  expirationDate?: Date;
}
