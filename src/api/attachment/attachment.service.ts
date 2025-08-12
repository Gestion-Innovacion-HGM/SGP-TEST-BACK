import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateExpirationMessage } from '@utils/date.utils';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import * as FormData from 'form-data';
import { extname } from 'path';
import * as ULID from 'ulid';

import { UserRepository } from '@infrastructure/repository/user.repository';

import { ResultAttachmentDto } from '@api/attachment/dto/result-attachment.dto';
import { UpdateAttachmentDto } from '@api/attachment/dto/update-attachment.dto';
import { DocumentService } from '@api/document/document.service';
import { MailerService } from '@api/mail-service/mail.service';

import { Attachment } from '@domain/attachment';
import { StatusAttachment } from '@domain/enums/attachment.enums';
import { Role } from '@domain/enums/role.enums';

@Injectable()
export class AttachmentService {
  private readonly simpleStorageUrl: string;

  public constructor(
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailerService,
    private readonly documentService: DocumentService,
  ) {
    this.simpleStorageUrl =
      this.configService.get<string>('SIMPLE_STORAGE_URL') ?? '';
  }

  /**
   * Maneja la carga de un archivo y retorna la entidad de attachment creada.
   *
   * @param file - El archivo que se va a cargar.
   * @param userId - El ID del usuario al que se le va a asociar el attachment.
   * @param documentName - El nombre del documento dentro del cual se creará el attachment.
   * @param expeditionDate - (Opcional) La fecha de expiración del attachment.
   * @returns Una promesa que se resuelve con la entidad de attachment creada.
   *
   * @throws BadRequestException si el archivo no es un PDF válido o si el formato del ID de usuario es inválido.
   * @throws NotFoundException si el usuario, el folder o el documento no son encontrados.
   */

  public async createAttachment(
    file: Express.Multer.File,
    userId: string,
    documentName: string,
    expeditionDate?: string,
  ): Promise<ResultAttachmentDto> {
    let objectId: ObjectId;

    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      throw new BadRequestException('Invalid user ID format.');
    }

    const user = await this.userRepository.findOne({ _id: objectId });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    if (!user.folder) {
      throw new NotFoundException(
        `No folder found for user with ID '${userId}'.`,
      );
    }

    if (!user.folder.documents || user.folder.documents.length === 0) {
      throw new NotFoundException(
        `No documents found in the folder for user with ID '${userId}'.`,
      );
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );

    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found for user.`,
      );
    }

    const ulid = ULID.ulid();
    const filename = `${ulid}${extname(file.originalname)}`;

    const attachment = new Attachment();
    attachment.filename = filename;
    attachment.status = StatusAttachment.PENDING;
    attachment.isActive = true;

    if (expeditionDate) {
      attachment.expeditionDate = new Date(expeditionDate);
    }

    document.attachments.push(attachment);

    await this.entityManager.persistAndFlush(user);

    await this.uploadToSimpleStorage(file.buffer, filename);

    return plainToInstance(ResultAttachmentDto, attachment, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Verifies if the uploaded file is a PDF file.
   *
   * @param file - The file to be verified.
   * @returns A Promise that resolves to a boolean indicating whether the file is a PDF or not.
   */
  private async verifyPdf(file: Express.Multer.File): Promise<boolean> {
    const header = file.buffer.toString('utf-8', 0, 4);
    return header === '%PDF';
  }

  /**
   * Uploads a file to the Simple Storage service.
   *
   * @param fileBuffer - The file buffer to be uploaded.
   * @param filename - The name of the file.
   *
   * @throws {BadRequestException} If there is an error uploading the file to the Simple Storage service.
   */
  private async uploadToSimpleStorage(
    fileBuffer: Buffer,
    filename: string,
  ): Promise<void> {
    const url = `${this.simpleStorageUrl}/`;
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    try {
      const response = await axios.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (response.status !== 200) {
        throw new BadRequestException(
          'No se pudo cargar el archivo en el servicio de simple-storage.',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        `Error al cargar el archivo en almacenamiento simple: ${error.message}`,
      );
    }
  }

  /**
   * Retrieves all attachments with pagination support.
   *
   * @param page - The page number to retrieve (default: 1).
   * @param size - The number of items per page (default: 10).
   * @returns A promise that resolves to an object containing the retrieved attachments and the total count.
   *
   * @throws {BadRequestException} If the page is less than 1 or the size is less than 1 or greater than 50.
   * @throws {BadRequestException} If there is an error retrieving the attachments from the simple-storage service.
   */
  public async findAllAttachment(
    page: number = 1,
    size?: number,
  ): Promise<{ items: any[]; count: number }> {
    if (page < 1) {
      throw new BadRequestException('La página debe ser mayor a 0');
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor a 1 y menor que 50',
      );
    }
    const offset = (page - 1) * (size ?? 0);

    try {
      const response = await axios.get(`${this.simpleStorageUrl}/files`, {
        params: { offset, limit: size },
      });

      if (response.status !== 200) {
        throw new Error(
          'Failed to retrieve files from simple-storage service.',
        );
      }

      return {
        items: response.data.files,
        count: response.data.total,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error retrieving files from simple-storage: ${error.message}`,
      );
    }
  }

  /**
   * Finds all attachments for a user by user ID.
   *
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of ResultAttachmentDto.
   *
   * @throws NotFoundException if the user or their documents are not found.
   */
  public async findAttachmentsByUserId(
    userId: string,
  ): Promise<ResultAttachmentDto[]> {
    let objectId: ObjectId;

    // Intenta convertir el userId en ObjectId
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      throw new BadRequestException('Invalid user ID format.');
    }

    const user = await this.userRepository.findOne({
      _id: objectId,
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    if (
      !user.folder ||
      !user.folder.documents ||
      user.folder.documents.length === 0
    ) {
      throw new NotFoundException(
        `No documents found in the folder for user with ID '${userId}'.`,
      );
    }

    const attachments = user.folder.documents.flatMap((doc) => doc.attachments);

    return plainToInstance(ResultAttachmentDto, attachments, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Downloads a file based on the user's ID and the file name (ULID).
   *
   * @param userId - The ID of the user.
   * @param filename - The name of the file (ULID).
   * @returns A stream of the downloaded file.
   *
   * @throws NotFoundException if the user, document, or attachment is not found.
   * @throws BadRequestException if the user ID is invalid or if the file download fails.
   */
  public async downloadAttachment(
    userId: string,
    filename: string,
  ): Promise<Buffer> {
    let objectId: ObjectId;

    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      throw new BadRequestException('Invalid user ID format.');
    }

    const user = await this.userRepository.findOne({ _id: objectId });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    if (
      !user.folder ||
      !user.folder.documents ||
      user.folder.documents.length === 0
    ) {
      throw new NotFoundException(
        `No documents found for user with ID '${userId}'.`,
      );
    }

    const attachment = user.folder.documents
      .flatMap((doc) => doc.attachments)
      .find((att) => att.filename === filename);

    if (!attachment) {
      throw new NotFoundException(
        `Attachment with filename '${filename}' not found.`,
      );
    }

    try {
      const response = await axios.get(`${this.simpleStorageUrl}/${filename}`, {
        responseType: 'arraybuffer',
      });

      if (response.status !== 200) {
        throw new BadRequestException(
          'Failed to download the file from simple-storage.',
        );
      }

      return Buffer.from(response.data);
    } catch (error) {
      throw new BadRequestException(
        `Error downloading the file: ${error.message}`,
      );
    }
  }

  /**
   * Updates the status of an attachment based on the user's document number.
   *
   * @param documentNumber - The document number of the user.
   * @param attachmentFilename - The filename of the attachment.
   * @param status - The new status of the attachment.
   * @returns A promise that resolves to the updated attachment.
   *
   * @throws NotFoundException if the user or attachment is not found.
   */
  public async updateAttachmentStatus(
    documentNumber: string,
    attachmentFilename: string,
    status: StatusAttachment,
  ): Promise<ResultAttachmentDto> {
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

    const attachment = user.folder.documents
      .flatMap((doc) => doc.attachments)
      .find((att) => att.filename === attachmentFilename);

    if (!attachment) {
      throw new NotFoundException(
        `Attachment with filename '${attachmentFilename}' not found.`,
      );
    }

    attachment.status = status;
    await this.entityManager.persistAndFlush(user);
    return plainToInstance(
      ResultAttachmentDto,
      {
        ...attachment,
        createdAt: attachment.createdAt || new Date(),
        updatedAt: attachment.updatedAt || new Date(),
      },
      {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Replaces the attachment for a specific document of a user.
   *
   * @param userId - The ID of the user.
   * @param documentName - The name of the document.
   * @param newFile - The new file to replace the attachment.
   * @returns A promise that resolves to a ResultAttachmentDto object representing the updated attachment.
   *
   * @throws BadRequestException if the uploaded file is not a PDF.
   * @throws NotFoundException if the user or the document is not found, or if there is no attachment for the current month.
   */
  public async replaceAttachment(
    userId: string,
    documentName: string,
    newFile: Express.Multer.File,
  ): Promise<ResultAttachmentDto> {
    const isValidPdf = await this.verifyPdf(newFile);
    if (!isValidPdf) {
      throw new BadRequestException('El archivo subido no es un PDF.');
    }

    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );
    if (!document) {
      throw new NotFoundException('Documento no encontrado.');
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const attachment = document.attachments.find((att) => {
      const attDate = new Date(att.createdAt);
      return (
        attDate.getMonth() === currentMonth &&
        attDate.getFullYear() === currentYear
      );
    });

    if (!attachment) {
      throw new NotFoundException(
        'No se encontró un attachment para el mes actual.',
      );
    }

    const existingFilename = attachment.filename;

    await this.uploadToSimpleStorage(newFile.buffer, existingFilename);

    attachment.updatedAt = new Date();

    await this.entityManager.persistAndFlush(user);

    return plainToInstance(ResultAttachmentDto, attachment, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Sends an email notification based on the role and action of the sender.
   *
   * There are two types of notifications that this function can handle:
   * 1. **Collaborator Notification:** Sent when a collaborator uploads documents and notifies the reviewer.
   *    - The email content informs the reviewer that the documents are ready for review.
   * 2. **Revisor Notification:** Sent when a reviewer has finished reviewing the documents or has proposed changes.
   *    - This type of notification is restricted to users with the roles SUPERUSUARIO, MODERADOR, or COORDINADOR.
   *    - The email content informs the user that some documents were not approved and provides a link to review the comments and resubmit the documents.
   *
   * @param email - The email address to send the notification to.
   * @param userId - The ID of the user associated with the documents.
   * @param details - The details of the user who uploaded the documents.
   * @param currentUser - The currently authenticated user, extracted from req.user.
   * @param messageType - Specifies whether the notification is for a collaborator or a revisor.
   *                      Accepted values are 'collaborator' or 'revisor'.
   * @throws BadRequestException if required parameters are missing.
   * @throws ForbiddenException if the current user does not have the necessary roles to send a revisor notification.
   * @throws ServiceUnavailableException if there is an issue sending the email.
   */
  public async sendEmailNotification(
    email: string,
    userId: string,
    details: string,
    currentUser: any,
    messageType: 'collaborator' | 'revisor',
  ): Promise<void> {
    try {
      if (!email) {
        throw new BadRequestException('El correo electrónico es requerido.');
      }
      if (!userId) {
        throw new BadRequestException('El ID de usuario es requerido.');
      }
      if (!details) {
        throw new BadRequestException(
          'Los detalles del usuario son requeridos.',
        );
      }

      if (
        messageType === 'revisor' &&
        !(
          currentUser.roles.includes(Role.SUPERUSER) ||
          currentUser.roles.includes(Role.MODERATOR) ||
          currentUser.roles.includes(Role.COORDINATOR)
        )
      ) {
        throw new ForbiddenException(
          'No tienes permisos para enviar este tipo de notificación.',
        );
      }

      const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL');
      const uploadLink = `http://localhost:3001/dashboard`;
      const reviewLink = `http://localhost:3001/users/${userId}/`;

      let content = '';

      if (messageType === 'collaborator') {
        content = `
      <p>El usuario con los siguientes detalles: ${details} ha subido sus documentos y están listos para revisión.</p>
      <p>Puedes revisarlos haciendo clic en el siguiente enlace:</p>
      <a href="${uploadLink}">Revisar Documentos</a>
    `;
      } else if (messageType === 'revisor') {
        content = `
      <p>Algunos documentos que has subido no fueron aprobados. Por favor, revisa los comentarios y vuelve a subir los documentos corregidos.</p>
      <p>Puedes consultar los detalles haciendo clic en el siguiente enlace:</p>
      <a href="${reviewLink}">Consultar Documentos</a>
    `;
      }

      const mailData = {
        receivers: [{ email: email }],
        subject:
          messageType === 'collaborator'
            ? 'Documentos subidos exitosamente'
            : 'Documentos necesitan revisión',
        params: {
          details: details,
        },
        sender: { email: senderEmail },
      };

      const result = await this.mailService.sendMail({
        mailData,
        content,
      });

      if (!result) {
        throw new ServiceUnavailableException(
          `No fue posible enviar el correo electrónico a "${email}".`,
        );
      }

      console.log('Email result: ', result);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new ServiceUnavailableException(
        `No fue posible enviar el correo electrónico a "${email}".`,
      );
    }
  }

  /**
   * Updates an existing attachment with the provided data.
   *
   * @param filename - The filename of the attachment to update.
   * @param updateData - The data to update the attachment with.
   * @returns A promise that resolves to the updated attachment data.
   *
   * @throws NotFoundException - If no attachment with the given filename is found.
   */
  public async updateAttachment(
    filename: string,
    updateData: UpdateAttachmentDto,
  ): Promise<ResultAttachmentDto> {
    const attachment = await this.entityManager.findOne(Attachment, {
      filename,
    });

    if (!attachment) {
      throw new NotFoundException(
        `Attachment with filename '${filename}' not found.`,
      );
    }

    if (updateData.filename) {
      attachment.filename = updateData.filename;
    }
    if (updateData.status) {
      attachment.status = updateData.status;
    }
    if (updateData.isActive !== undefined) {
      attachment.isActive = updateData.isActive;
    }
    if (updateData.expeditionDate) {
      attachment.expeditionDate = updateData.expeditionDate;
    }

    await this.entityManager.persistAndFlush(attachment);

    return plainToInstance(ResultAttachmentDto, attachment, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Updates the expedition date of a specific attachment for a user's document.
   *
   * @param documentNumber - The document number of the user.
   * @param documentName - The name of the document.
   * @param filename - The filename of the attachment.
   * @param expeditionDate - The new expedition date to be set.
   * @returns A promise that resolves to an object containing the updated attachment result and an expiration message.
   * @throws {NotFoundException} If the user, document, or attachment is not found.
   * @throws {BadRequestException} If the expedition date is not provided.
   */
  public async updateExpeditionDate(
    documentNumber: string,
    documentName: string,
    filename: string,
    expeditionDate: Date,
  ): Promise<{ result: ResultAttachmentDto; expirationMessage: string }> {
    // Buscar usuario por número de documento
    const user = await this.userRepository.findOne({
      idDocument: { number: documentNumber },
    });

    if (!user) {
      throw new NotFoundException(
        `User with document number '${documentNumber}' not found.`,
      );
    }

    // Buscar documento por nombre
    const document = user.folder.documents.find(
      (doc) => doc.name === documentName,
    );
    if (!document) {
      throw new NotFoundException(
        `Document with name '${documentName}' not found for user '${documentNumber}'.`,
      );
    }

    // Buscar archivo adjunto por nombre de archivo
    const attachment = document.attachments.find(
      (att) => att.filename === filename,
    );
    if (!attachment) {
      throw new NotFoundException(
        `Attachment with filename '${filename}' not found in document '${documentName}'.`,
      );
    }

    // Validar la fecha de expedición
    if (!expeditionDate) {
      throw new BadRequestException('Expedition date is required.');
    }

    // Actualizar la fecha de expedición del adjunto
    attachment.expeditionDate = expeditionDate;
    await this.entityManager.persistAndFlush(user);

    // Actualizar la fecha de expiración del documento
    await this.documentService.updateExpirationDate(
      expeditionDate,
      user.id,
      documentName,
    );

    // Generar mensaje de expiración usando el helper
    const expirationMessage = document.expirationDate
      ? generateExpirationMessage(document.expirationDate, documentName)
      : `No hay fecha de expiración para el documento '${documentName}'.`;

    // Retornar resultado y mensaje
    return {
      result: plainToInstance(ResultAttachmentDto, attachment, {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
      expirationMessage,
    };
  }
}
