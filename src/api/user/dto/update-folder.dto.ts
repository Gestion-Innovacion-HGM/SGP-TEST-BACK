import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { UpdateDocumentDto } from '@api/document/dto/update-document.dto';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentDto)
  documents?: UpdateDocumentDto[];
}
