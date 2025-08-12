import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateHiringDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  requisitesNames?: string[];
}
