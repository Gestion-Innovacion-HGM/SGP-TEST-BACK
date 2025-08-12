import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { CreateAccountDto } from '@api/user/dto/create-account.dto';
import { CreateAddressDto } from '@api/user/dto/create-address.dto';
import { CreateFolderDto } from '@api/user/dto/create-folder.dto';
import { CreateIdDocumentDto } from '@api/user/dto/create-id-document.dto';
import { CreateMilitaryCardDto } from '@api/user/dto/create-military-card.dto';

import { Role } from '@domain/enums/role.enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 16, {
    message: 'El primer nombre debe tener entre 2 y 16 caracteres.',
  })
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(2, 16, {
    message: 'El segundo nombre debe tener entre 2 y 16 caracteres.',
  })
  secondName?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 16, {
    message: 'El primer apellido debe tener entre 2 y 16 caracteres.',
  })
  surname: string;

  @IsOptional()
  @IsString()
  @Length(2, 16, {
    message: 'El segundo apellido debe tener entre 2 y 16 caracteres.',
  })
  secondSurname?: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsNotEmpty()
  @IsDateString(
    {},
    {
      message: 'La fecha de nacimiento debe tener el formato "YYYY-MM-DD".',
    },
  )
  @Length(10, 10, {
    message: 'La fecha de nacimiento debe tener 10 caracteres".',
  })
  birthdate: string;

  @IsNotEmpty({ message: 'El sexo es obligatorio.' })
  @IsString({ message: 'El sexo debe ser una cadena de texto.' })
  @IsIn(['Hombre', 'Mujer', 'Indeterminado o Intersexual'], {
    message:
      'El sexo debe ser uno de estos tres valores: "Hombre" o "Mujer" o "Indeterminado o Intersexual".',
  })
  sex: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateIdDocumentDto)
  idDocument: CreateIdDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMilitaryCardDto)
  militaryCard?: CreateMilitaryCardDto;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  servicesNames: string[];

  @IsString()
  @IsNotEmpty()
  profileName: string;

  @IsString()
  @IsNotEmpty()
  hiringName: string;

  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsEnum(Role, { each: true, message: 'Los roles deben ser válidos' })
  @ArrayUnique({ message: 'Los roles deben ser únicos.' })
  @ArrayMinSize(1, { message: 'El usuario debe tener al menos un rol' })
  roles: Role[];

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ValidateNested()
  @Type(() => CreateAccountDto)
  account: CreateAccountDto;

  @ValidateNested()
  @Type(() => CreateFolderDto)
  folder: CreateFolderDto;

  @IsBoolean()
  isActive: boolean = true;
}
