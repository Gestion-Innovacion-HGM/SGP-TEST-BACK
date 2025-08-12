import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateMilitaryCardDto {
  @IsOptional()
  @IsString()
  @IsIn(['PRIMERA CLASE', 'SEGUNDA CLASE'], {
    message: 'La clase debe ser "PRIMERA CLASE" o "SEGUNDA CLASE".',
  })
  class?: string;

  @IsOptional()
  @IsString()
  @Length(10, 10, {
    message: 'El número de la libreta militar debe tener 10 dígitos.',
  })
  number?: string;

  @IsOptional()
  @IsString()
  district?: string;
}
