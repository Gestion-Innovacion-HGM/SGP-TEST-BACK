import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateProfileDto {
  @IsNotEmpty()
  @Length(3, 80, { message: 'El nombre debe tener entre 3 y 80 caracteres.' })
  readonly name: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'La lista de requisitos no debe estar vacia' })
  @IsNotEmpty({ each: true })
  readonly requisitesNames: string[];

  @IsBoolean()
  isActive: boolean;
}
