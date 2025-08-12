import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { UpdateAttachmentDto } from '@api/attachment/dto/update-attachment.dto';

import { State } from '@domain/enums/state.enums';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(State)
  state?: State;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttachmentDto)
  attachments?: UpdateAttachmentDto[];

  @IsOptional()
  @IsBoolean()
  hasExpiration?: boolean;

  @IsOptional()
  @IsDateString()
  expirationDate?: Date;
}
