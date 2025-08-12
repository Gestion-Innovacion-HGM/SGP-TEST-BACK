import { Expose } from 'class-transformer';

export class ResultAccountDto {
  @Expose()
  username: string;
}
