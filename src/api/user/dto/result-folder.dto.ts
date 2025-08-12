import { Expose, Type } from 'class-transformer';

import { ResultDocumentDto } from '@api/user/dto/result-document.dto';

import { State } from '@domain/enums/state.enums';

export class ResultFolderDto {
  @Expose()
  name: string;

  @Expose()
  @Type(() => State as any)
  state: State;

  @Expose()
  @Type(() => ResultDocumentDto)
  documents: ResultDocumentDto[];
}
