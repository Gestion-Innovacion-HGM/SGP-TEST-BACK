import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  BlockOrInterior,
  PropertyType,
  TypeOfRoad,
} from '@domain/enums/address.enums';

export class CreateAddressDto {
  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  municipality: string;

  @IsNotEmpty()
  neighborhood: string;

  @IsEnum(TypeOfRoad, {
    each: true,
    message: 'Los tipos de vías deben ser validos',
  })
  @IsNotEmpty()
  typeOfRoad: TypeOfRoad;

  @IsString()
  @IsOptional()
  firstAddressField?: string;

  @IsString()
  @IsOptional()
  secondAddressField?: string;

  @IsString()
  @IsOptional()
  thirdAddressField?: string;

  @IsEnum(PropertyType, {
    each: true,
    message: 'Los tipos de propiedad deben ser validos',
  })
  @IsOptional()
  propertyType?: PropertyType;

  @IsString()
  @IsOptional()
  namePropertyType?: string;

  @IsEnum(BlockOrInterior, {
    each: true,
    message: 'Los tipos de bloque o interior deben ser validos',
  })
  @IsOptional()
  blockOrInterior?: BlockOrInterior;

  @IsString()
  @IsOptional()
  blockOrInteriorName?: string;

  @IsString()
  @IsOptional()
  observation?: string;
}
