import { Expose } from 'class-transformer';

export class ResultMilitaryCardDto {
  @Expose()
  class: string;

  @Expose()
  number: string;

  @Expose()
  district: string;
}
