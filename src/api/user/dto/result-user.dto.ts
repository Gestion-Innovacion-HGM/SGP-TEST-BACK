import { Expose, Transform, Type } from 'class-transformer';

import { ResultAccountDto } from '@api/user/dto/result-account.dto';
import { ResultAddressDto } from '@api/user/dto/result-address.dto';
import { ResultFolderDto } from '@api/user/dto/result-folder.dto';
import { ResultIdDocumentDto } from '@api/user/dto/result-id-document.dto';
import { ResultMilitaryCardDto } from '@api/user/dto/result-military-card.dto';

import { Role } from '@domain/enums/role.enums';

export class ResultUserDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  secondName?: string;

  @Expose()
  surname: string;

  @Expose()
  secondSurname?: string;

  @Expose()
  email: string;

  @Expose()
  birthdate: string;

  @Expose()
  sex: string;

  @Expose()
  @Type(() => ResultIdDocumentDto)
  idDocument: ResultIdDocumentDto;

  @Expose()
  @Type(() => ResultMilitaryCardDto)
  militaryCard?: ResultMilitaryCardDto;

  @Expose()
  @Type(() => String)
  roles: Role[];

  @Expose()
  @Type(() => ResultAddressDto)
  address: ResultAddressDto;

  @Expose()
  @Type(() => ResultAccountDto)
  account: ResultAccountDto;

  @Expose()
  @Type(() => ResultFolderDto)
  folder: ResultFolderDto;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  createdAt: string;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), {
    toClassOnly: true,
  })
  updatedAt: string;

  @Expose()
  isActive: boolean;
}
