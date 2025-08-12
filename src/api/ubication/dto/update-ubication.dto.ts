import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUbicationDto {
  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsNumber()
  daneStateCode?: number;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber()
  daneMunicipalityCode?: number;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
