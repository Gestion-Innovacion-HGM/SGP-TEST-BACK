import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateHiringDto {
  @IsNotEmpty()
  @Length(3, 40, { message: 'El nombre debe tener entre 3 y 40 caracteres.' })
  readonly type: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'La lista de requisitos no debe estar vacia' })
  @IsNotEmpty({ each: true })
  readonly requisitesNames: string[];

  @IsBoolean()
  isActive: boolean;
}
