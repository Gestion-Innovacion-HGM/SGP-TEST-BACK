import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { UpdateAccountDto } from '@api/user/dto/update-account.dto';
import { UpdateAddressDto } from '@api/user/dto/update-address.dto';
import { UpdateFolderDto } from '@api/user/dto/update-folder.dto';
import { UpdateIdDocumentDto } from '@api/user/dto/update-id-document.dto';
import { UpdateMilitaryCardDto } from '@api/user/dto/update-military-card.dto';

import { Role } from '@domain/enums/role.enums';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 16)
  firstName?: string;

  @IsOptional()
  @IsString()
  secondName?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  secondSurname?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIdDocumentDto)
  idDocument?: UpdateIdDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateMilitaryCardDto)
  militaryCard?: UpdateMilitaryCardDto;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAccountDto)
  account?: UpdateAccountDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFolderDto)
  folder?: UpdateFolderDto;
}
