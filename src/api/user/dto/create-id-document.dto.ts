import { NoSpacesBetween } from '@validation/decorators/no-spaces-between.decorator';
import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateIdDocumentDto {
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @IsString()
  @IsIn(['CC', 'CE', 'PA'], {
    message:
      'El tipo de documento debe ser "CC" (cédula de ciudadanía), "CE" (cédula de extranjería), o "PA" (pasaporte)',
  })
  type: string;

  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @IsString()
  @Length(6, 16, {
    message: 'El número de documento debe tener entre 6 y 16 caracteres',
  })
  @NoSpacesBetween({
    message:
      'El número de documento no debe contener espacios entre caracteres.',
  })
  number: string;
}
