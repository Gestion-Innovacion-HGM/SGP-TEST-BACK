import { IsBoolean, IsNotEmpty, Length } from 'class-validator';

export class CreateTowerDto {
  @IsNotEmpty()
  @Length(3, 20, { message: 'El nombre debe tener entre 3 y 20 caracteres.' })
  readonly name: string;

  @IsBoolean()
  isActive: boolean;
}
