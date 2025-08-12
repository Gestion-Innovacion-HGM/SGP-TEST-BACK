// UpdateIdDocumentDto
import { NoSpacesBetween } from '@validation/decorators/no-spaces-between.decorator';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateIdDocumentDto {
  @IsOptional()
  @IsString()
  @IsIn(['CC', 'CE', 'PA'], {
    message: 'El tipo de documento debe ser "CC", "CE" o "PA".',
  })
  type?: string;

  @IsOptional()
  @IsString()
  @Length(6, 16, {
    message: 'El número de documento debe tener entre 6 y 16 caracteres',
  })
  @NoSpacesBetween({
    message: 'El número de documento no debe contener espacios.',
  })
  number?: string;
}
