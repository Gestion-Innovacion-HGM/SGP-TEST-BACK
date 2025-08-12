import { Expose } from 'class-transformer';

export class ResultIdDocumentDto {
  @Expose()
  type: string;

  @Expose()
  number: string;
}
