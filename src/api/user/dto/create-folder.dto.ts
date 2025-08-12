import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CreateDocumentDto } from '@api/document/dto/create-document.dto';
import { CreateHiringDto } from '@api/hiring/dto/create-hiring.dto';
import { CreateProfileDto } from '@api/profile/dto/create-profile.dto';
import { CreateServiceDto } from '@api/service/dto/create-service.dto';

import { State } from '@domain/enums/state.enums';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(State)
  state: State;

  @ValidateNested()
  @Type(() => CreateHiringDto)
  hiring: CreateHiringDto;

  @ValidateNested()
  @Type(() => CreateHiringDto)
  inheritable: CreateHiringDto;

  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile: CreateProfileDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceDto)
  services: CreateServiceDto[];

  @IsArray()
  @ValidateNested()
  @Type(() => CreateDocumentDto)
  documents: CreateDocumentDto[];
}
