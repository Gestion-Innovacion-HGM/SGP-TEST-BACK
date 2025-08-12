import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'The name must be between 1 and 50 characters.' })
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
