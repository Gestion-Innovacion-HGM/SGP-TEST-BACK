import {
  Embeddable,
  Embedded,
  Enum,
  OneToOne,
  Property,
} from '@mikro-orm/core';

import { Document } from '@domain/document';
import { State } from '@domain/enums/state.enums';
import { Hiring } from '@domain/hiring';
import { Profile } from '@domain/profile';
import { Requisite } from '@domain/requisite';
import { Service } from '@domain/service';

@Embeddable()
export class Folder {
  @Property()
  name!: string;

  @Enum(() => State)
  state!: State;

  @Property({ default: true })
  isActive: boolean;

  @OneToOne(() => Hiring, { nullable: true })
  hiring?: Hiring;

  @OneToOne(() => Hiring, { nullable: true })
  inheritable?: Hiring;

  @OneToOne(() => Profile, { nullable: true })
  profile?: Profile;

  @Property({ type: 'array' })
  services: Service[];

  @Embedded(() => Document, { array: true })
  documents: Document[] = [];

  /**
   * Scaffolds the folder with the provided requisites.
   *
   * @param requisites - List of requisites to scaffold the folder.
   */
  scaffold(requisites: Requisite[]): void {
    // Remove duplicate requisites
    const uniqueRequisites = Array.from(
      new Set(requisites.map((r) => r._id)),
    ).map((id) => requisites.find((r) => r._id === id));

    // Create a document for each unique requisite
    const documents: Document[] = uniqueRequisites.map((requisite) => {
      const document = new Document();
      document.name = requisite?.name || '';
      document.state = State.PENDING;
      document.format = requisite?.format || '';
      document.description = requisite?.description || '';
      document.attachments = [];
      document.hasExpiration = false;
      document.isActive = true;
      document.createdAt = new Date();
      document.updatedAt = new Date();
      return document;
    });
    // Set the documents and folder state
    this.documents = documents;
    this.state = State.PENDING;
  }
}
