import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateUbicationDto {
  @IsNotEmpty()
  region: string;

  @IsNotEmpty()
  daneStateCode: number;

  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  daneMunicipalityCode: number;

  @IsNotEmpty()
  municipality: string;

  @IsBoolean()
  isActive: boolean;
}
