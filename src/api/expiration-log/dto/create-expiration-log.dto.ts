import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class ExpiringDocument {
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @IsString()
  @IsNotEmpty()
  idAttachment: string;

  @IsDate()
  @IsNotEmpty()
  expirationDate: Date;

  @IsNumber()
  @IsNotEmpty()
  daysToExpiration: number;
}

export class CreateExpirationLogDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpiringDocument)
  documents: ExpiringDocument[];
}
