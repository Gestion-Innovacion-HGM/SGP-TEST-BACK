import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateFloorDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'El nombre debe tener entre 1 y 50 caracteres.' })
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
