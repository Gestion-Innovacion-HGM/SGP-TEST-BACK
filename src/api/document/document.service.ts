import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateExpirationMessage } from '@utils/date.utils';
import { plainToInstance } from 'class-transformer';

import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';
import { UserRepository } from '@infrastructure/repository/user.repository';

import { ResultDocumentDto } from '@api/document/dto/result-document.dto';
import { UpdateDocumentDto } from '@api/document/dto/update-document.dto';
import { MailerService } from '@api/mail-service/mail.service';

import { StatusAttachment } from '@domain/enums/attachment.enums';
import { Role } from '@domain/enums/role.enums';
import { State } from '@domain/enums/state.enums';
import { ValidityUnit } from '@domain/enums/validity-unit.enums';
import { User } from '@domain/user';

@Injectable()
export class DocumentService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly requisiteRepository: RequisiteRepository,
    private readonly config: ConfigService,
    private readonly mailService: MailerService,
  ) {}

  /**
   * Retrieves a list of documents by the provided ID number.
   *
   * @param idUser - The ID number of the user to retrieve documents for.
   * @param currentUser - The current user making the request.
   * @returns A promise that resolves to an array of ResultDocumentDto objects representing the documents found.
   *
   * @throws {BadRequestException} If the current user or roles are not defined.
   * @throws {NotFoundException} If the user with the provided ID number is not found or if no documents are found in the user's folder.
   * @throws {ForbiddenException} If the current user is a collaborator but does not have permission to access the documents.
   */
  public async findDocumentsById(
    idUser: string,
    currentUser: User,
  ): Promise<ResultDocumentDto[]> {
    if (!currentUser || !currentUser.roles) {
      throw new BadRequestException('Current user or roles are not defined.');
    }
    const user = await this.userRepository.findOne({ id: idUser });
    if (!user) {
      throw new NotFoundException(`User with ID '${idUser}' not found.`);
    }

    const isCollaborator = currentUser.roles.includes(Role.COLLABORATOR);
    const isSuperUserOrModeratorOrCoordinator = currentUser.roles.some((role) =>
      [Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR].includes(role),
    );
    if (
      isCollaborator &&
      user.id !== currentUser.id &&
      !isSuperUserOrModeratorOrCoordinator
    ) {
      throw new ForbiddenException(
        'You do not have permission to access these documents.',
      );
    }
    if (
      !user.folder ||
      !user.folder.documents ||
      user.folder.documents.length === 0
    ) {
      throw new NotFoundException(
        `No documents found in the folder for user '${idUser}'.`,
      );
    }
    return plainToInstance(ResultDocumentDto, user.folder.documents, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Download a document by the user's document number and document name.
   *
   * @param documentNumber - The document number of the user.
   * @param documentName - The name of the document to download.
   * @returns The document file buffer and file name.
   *
   * @throws NotFoundException if the user or document is not found.
   */
  public async downloadDocument(
    documentNumber: string,
    documentName: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const user = await this.userRepository.findOne({
      idDocument: {
        number: documentNumber,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with document number '${documentNumber}' not found.`,
      );
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );

    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found for user '${documentNumber}'.`,
      );
    }
    const buffer = Buffer.from('This is a simulated document content.');
    const filename = `${documentName}.pdf`;

    return { buffer, filename };
  }

  /**
   * Update the expiration date of a document.
   *
   * @param documentNumber - The document number of the user.
   * @param documentName - The name of the document to update.
   * @param expeditionDate - The new expiration date.
   * @returns The updated document.
   *
   * @throws NotFoundException if the user or document is not found.
   * @throws BadRequestException if the expiration date is invalid.
   */
  public async updateDocumentExpedition(
    documentNumber: string,
    documentName: string,
    expeditionDate: Date,
  ): Promise<ResultDocumentDto> {
    const user = await this.userRepository.findOne({
      idDocument: {
        number: documentNumber,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with document number '${documentNumber}' not found.`,
      );
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );

    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found for user '${documentNumber}'.`,
      );
    }

    if (!expeditionDate) {
      throw new BadRequestException('Expedition date is required.');
    }

    document.expirationDate = expeditionDate;
    await this.entityManager.persistAndFlush(user);

    return plainToInstance(ResultDocumentDto, document, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update the state of a document and its last attachment, with an optional rejection message.
   *
   * This method updates the state of a specified document belonging to a user and also updates the state
   * of the last attachment associated with that document. The last attachment is determined based on the
   * most recent `updatedAt` timestamp. If the document has no attachments, an error is thrown. Additionally,
   * if the cast from document state to attachment status fails, an error is also thrown.
   *
   * If the document state is set to `REJECTED`, an optional `rejectionMessage` can be provided to explain
   * why the document was rejected. The `rejectionMessage` has a maximum length of 500 characters.
   *
   * @param userId - The ID of the user to whom the document belongs.
   * @param documentName - The name of the document to update.
   * @param state - The new state to apply to the document and the last attachment.
   * @param rejectionMessage - (Optional) A message explaining why the document was rejected (only applicable if the state is `REJECTED`).
   * @returns A promise that resolves to a `ResultDocumentDto` object representing the updated document.
   *
   * @throws {NotFoundException} If the user with the provided ID is not found.
   * @throws {NotFoundException} If the document with the specified name is not found for the user.
   * @throws {NotFoundException} If the document has no attachments.
   * @throws {BadRequestException} If the provided state is invalid.
   * @throws {BadRequestException} If the state cannot be cast to a valid attachment status.
   * @throws {BadRequestException} If the `rejectionMessage` exceeds 500 characters.
   */

  public async updateDocumentState(
    userId: string,
    documentName: string,
    state: State,
    rejectionMessage?: string,
  ): Promise<ResultDocumentDto> {
    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );

    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found for user with ID '${userId}'.`,
      );
    }

    if (!Object.values(State).includes(state)) {
      throw new BadRequestException(
        `Invalid state '${state}' provided for document '${documentName}'.`,
      );
    }

    document.state = state;

    if (rejectionMessage && state === State.REJECTED) {
      document.rejectionMessage = rejectionMessage;
    }

    const lastAttachment = document.attachments.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    if (!lastAttachment) {
      throw new NotFoundException(
        `Document '${documentName}' has no attachments to update.`,
      );
    }

    try {
      lastAttachment.status = state as unknown as StatusAttachment;
    } catch (error) {
      throw new BadRequestException(
        `Failed to cast document state '${state}' to a valid attachment status.`,
      );
    }

    await this.entityManager.persistAndFlush(user);

    return plainToInstance(ResultDocumentDto, document, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Updates a document for a specific user.
   *
   * @param userId - The ID of the user whose document is to be updated.
   * @param documentName - The name of the document to be updated.
   * @param updateData - The data to update the document with.
   * @returns A promise that resolves to the updated document.
   *
   * @throws NotFoundException - If the user or document is not found.
   */
  public async updateDocument(
    userId: string,
    documentName: string,
    updateData: UpdateDocumentDto,
  ): Promise<ResultDocumentDto> {
    const user = await this.userRepository.findOne({ id: userId });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );

    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found.`,
      );
    }

    if (updateData.name) {
      document.name = updateData.name;
    }
    if (updateData.state) {
      document.state = updateData.state;
    }
    if (updateData.isActive !== undefined) {
      document.isActive = updateData.isActive;
    }
    if (updateData.format) {
      document.format = updateData.format;
    }
    if (updateData.description) {
      document.description = updateData.description;
    }

    if (updateData.attachments && updateData.attachments.length > 0) {
      document.attachments = document.attachments.map((existingAttachment) => {
        const updatedAttachment = updateData.attachments?.find(
          (att) => att.filename === existingAttachment.filename,
        );

        if (updatedAttachment) {
          existingAttachment.status =
            updatedAttachment.status || existingAttachment.status;
          existingAttachment.isActive =
            updatedAttachment.isActive ?? existingAttachment.isActive;
          existingAttachment.expeditionDate = existingAttachment.expeditionDate;
        }

        return existingAttachment;
      });
    }

    if (updateData.hasExpiration !== undefined) {
      document.hasExpiration = updateData.hasExpiration;
    }
    if (updateData.expirationDate) {
      document.expirationDate = updateData.expirationDate;
    }

    await this.entityManager.persistAndFlush(user);

    return plainToInstance(ResultDocumentDto, document, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  public calculateValidityInDays(
    validityValue: number,
    validityUnit: ValidityUnit,
  ): number {
    switch (validityUnit) {
      case ValidityUnit.DAY:
        return validityValue;
      case ValidityUnit.MONTH:
        return validityValue * 30;
      case ValidityUnit.YEAR:
        return validityValue * 365.25;
      default:
        throw new Error('Invalid validity unit');
    }
  }

  public async sendEmailDocumentExpirationDate(
    email: string,
    document: string,
    expirationDate: string,
    message: string,
  ): Promise<void> {
    try {
      const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL');

      const mailData = {
        receivers: [{ email: email }],
        subject: 'Novedades sobre sus documentos',
        params: {
          document: document,
          expirationDate: expirationDate,
        },
        sender: { email: senderEmail },
      };

      const content = `
        <p>Hola,</p>
        <p> ${message}</p>
        <p></p>

      `;

      const result = await this.mailService.sendMail({
        mailData,
        content,
      });

      if (!result) {
        throw new ServiceUnavailableException(
          `No fue posible enviar el correo electrónico a "${email}".`,
        );
      }

      console.log('Email sent successfully:', result);
    } catch (error) {
      throw new ServiceUnavailableException(
        `No fue posible enviar el correo electrónico a "${email}".`,
      );
    }
  }

  public async updateExpirationDate(
    expeditionDate: Date,
    idUser: string,
    name: string,
  ): Promise<void> {
    // Buscar usuario por ID
    const user = await this.userRepository.findOne({ id: idUser });
    if (!user) {
      throw new NotFoundException(`User with ID '${idUser}' not found.`);
    }

    // Buscar documento por nombre
    const document = user.folder.documents.find((doc) => doc.name === name);
    if (!document) {
      throw new NotFoundException(
        `Document with name '${name}' not found for user.`,
      );
    }

    // Buscar requisito por nombre
    const requisite = await this.requisiteRepository.findOne({ name });
    if (!requisite) {
      throw new NotFoundException(`Requisite with name '${name}' not found.`);
    }

    // Validar si el requisito requiere validez
    if (!requisite.isValidityRequired) {
      throw new BadRequestException(
        `Requisite '${name}' does not require validity.`,
      );
    }

    // Validar la fecha de expedición
    if (!expeditionDate) {
      throw new BadRequestException('Expedition date is required.');
    }

    // Calcular días de validez y fecha de expiración
    const validityDays = this.calculateValidityInDays(
      requisite.validityValue,
      requisite.validityUnit,
    );
    const expirationDate = new Date(expeditionDate);
    expirationDate.setDate(expirationDate.getDate() + validityDays);
    document.expirationDate = expirationDate;

    // Generar mensaje de expiración utilizando la utilidad
    const expirationMessage = generateExpirationMessage(
      document.expirationDate,
      document.name,
    );

    // Enviar correo con la información actualizada
    this.sendEmailDocumentExpirationDate(
      user.email,
      document.name,
      expirationDate.toDateString(),
      expirationMessage,
    );

    // Persistir cambios en la base de datos
    await this.entityManager.persistAndFlush(user);
  }
}
