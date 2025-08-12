import { ValidityUnit } from '@/domain/enums/validity-unit.enums';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateRequisiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'El nombre debe tener un máximo de 100 caracteres.',
  })
  name?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La descripción debe tener un máximo de 500 caracteres.',
  })
  description?: string;

  @IsNotEmpty()
  isValidityRequired: boolean;

  @ValidateIf((o) => o.validityRequired === true)
  @IsNotEmpty({
    message: 'El valor de la validez es obligatorio si se requiere validez.',
  })
  validityValue: number;

  @ValidateIf((o) => o.validityRequired === true)
  @IsNotEmpty({
    message: 'La unidad de validez es obligatoria si se requiere validez.',
  })
  validityUnit: ValidityUnit;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
