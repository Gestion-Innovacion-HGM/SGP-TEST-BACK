import { NoSpacesBetween } from '@validation/decorators/no-spaces-between.decorator';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateMilitaryCardDto {
  @IsNotEmpty({ message: 'La clase militar es obligatoria.' })
  @IsString()
  @IsIn(['PRIMERA CLASE', 'SEGUNDA CLASE'], {
    message: 'La clase militar debe ser "PRIMERA CLASE" o "SEGUNDA CLASE".',
  })
  class: string;

  @IsNotEmpty({ message: 'El número de la libreta militar es obligatorio.' })
  @IsString()
  @Length(10, 10, {
    message:
      'El número de la libreta militar debe tener exactamente 10 dígitos.',
  })
  @NoSpacesBetween({
    message:
      'El número de la libreta militar no debe contener espacios entre caracteres.',
  })
  number: string;

  @IsNotEmpty({ message: 'El distrito militar es obligatorio.' })
  @IsString()
  @Length(1, 2, {
    message: 'El distrito militar debe tener entre 1 y 2 dígitos.',
  })
  @NoSpacesBetween({
    message: 'El distrito militar no debe contener espacios entre caracteres.',
  })
  district: string;
}
