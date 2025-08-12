import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

import { Category } from '@domain/enums/category.enums';

export class CreateServiceDto {
  @IsEnum(Category)
  category: Category;

  @IsString()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  name: string;

  @IsOptional()
  @IsNumber()
  code?: number;

  @IsString()
  @Length(4, 4, { message: 'El centro de costos debe tener 4 caracteres.' })
  costCenter: string;

  @IsString()
  @Length(11, 11, { message: 'El nombre debe tener 11 caracteres.' })
  qualificationDistinctiveNumber: string;

  @IsNotEmpty()
  groupName: string;

  @ArrayMinSize(1)
  profilesNames: string[];

  @ArrayMinSize(1)
  locations: { floor: string; tower: string }[];

  @ArrayMinSize(1)
  requisitesNames: string[];

  @IsBoolean()
  isActive: boolean;
}
