import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { Category } from '@domain/enums/category.enums';

export class UpdateServiceDto {
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsString()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  name?: string;

  @IsOptional()
  @IsNumber()
  code?: number;

  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'El centro de costos debe tener 4 caracteres.' })
  costCenter?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'El nombre debe tener 11 caracteres.' })
  qualificationDistinctiveNumber?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @ArrayMinSize(1)
  profilesNames?: string[];

  @IsOptional()
  @ArrayMinSize(1)
  locations?: { floor: string; tower: string }[];

  @IsOptional()
  @ArrayMinSize(1)
  requisitesNames?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
