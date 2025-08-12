import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

import {
  BlockOrInterior,
  PropertyType,
  TypeOfRoad,
} from '@domain/enums/address.enums';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsEnum(TypeOfRoad)
  typeOfRoad?: TypeOfRoad;

  @IsOptional()
  @IsString()
  firstAddressField?: string;

  @IsOptional()
  @IsString()
  secondAddressField?: string;

  @IsOptional()
  @IsString()
  thirdAddressField?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @IsOptional()
  @IsString()
  namePropertyType?: string;

  @IsOptional()
  @IsEnum(BlockOrInterior)
  blockOrInterior?: BlockOrInterior;

  @IsOptional()
  @IsString()
  blockOrInteriorName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  observation?: string;
}
