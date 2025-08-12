import { IsBoolean, IsNotEmpty, Length } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty()
  @Length(10, 80, { message: 'El nombre debe tener entre 10 y 80 caracteres.' })
  name: string;

  @IsBoolean()
  isActive: boolean;
}
