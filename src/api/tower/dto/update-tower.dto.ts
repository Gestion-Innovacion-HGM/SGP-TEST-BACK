import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateTowerDto {
  @IsOptional()
  @IsString()
  @Length(3, 20, { message: 'El nombre debe tener entre 3 y 20 caracteres.' })
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
