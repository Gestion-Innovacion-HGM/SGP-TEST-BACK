import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ValidityUnit } from '@domain/enums/validity-unit.enums';

export class CreateRequisiteDto {
  @IsNotEmpty()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  name: string;

  @IsOptional()
  @MaxLength(500, {
    message: 'La descripción no debe exceder los 500 caracteres.',
  })
  description?: string;

  @IsOptional()
  format?: string;

  @IsNotEmpty()
  @IsBoolean({ message: 'El campo isValidityRequired debe ser un booleano.' })
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

  @IsBoolean()
  isActive: boolean;
}
