import {
  CreateRequestContext,
  EntityManager,
  MikroORM,
} from '@mikro-orm/mongodb';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateExpirationMessage } from '@utils/date.utils';

import { UserRepository } from '@infrastructure/repository/user.repository';

import { DocumentService } from '@api/document/document.service';
import { ExpirationLogService } from '@api/expiration-log/expiration-log.service';

@Injectable()
export class ScheduledTaskService {
  private readonly logger = new Logger(ScheduledTaskService.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly documentService: DocumentService,
    private readonly expirationLogService: ExpirationLogService,
  ) {}

  // Ejecutar los lunes a las 12 AM
  @Cron(CronExpression.EVERY_WEEK)
  @CreateRequestContext()
  async checkDocumentExpirations(): Promise<void> {
    this.logger.log(
      'Comenzando la tarea programada para verificar documentos próximos a vencer',
    );

    const users = await this.userRepository.findAll();
    for (const user of users) {
      const { folder, email, id: userId } = user;

      if (!folder || !folder.documents || folder.documents.length === 0) {
        this.logger.warn(
          `El usuario ${userId} no tiene documentos en su carpeta`,
        );
        continue;
      }

      const documentsToLog: {
        documentName: string;
        idAttachment: string;
        expirationDate: Date | undefined;
        daysToExpiration: number;
      }[] = [];

      const messages = folder.documents.map((document) => {
        const expirationMessage = document.expirationDate
          ? generateExpirationMessage(document.expirationDate, document.name)
          : `No hay fecha de expiración para el documento '${document.name}'.`;

        if (document.expirationDate) {
          const currentDate = new Date();
          const timeDifference =
            document.expirationDate.getTime() - currentDate.getTime();
          const daysToExpiration = Math.ceil(
            timeDifference / (1000 * 3600 * 24),
          );

          documentsToLog.push({
            documentName: document.name,
            idAttachment: document.attachments?.[0]?.filename ?? 'N/A',
            expirationDate: document.expirationDate,
            daysToExpiration: timeDifference < 0 ? 0 : daysToExpiration,
          });
        }

        return expirationMessage;
      });

      if (documentsToLog.length > 0) {
        // Guardar registros en la base de datos
        await this.expirationLogService.logExpirations({
          userId,
          documents: documentsToLog,
        });

        // Generar mensaje final para el correo
        const finalMessage = messages
          .filter((msg) => msg) // Eliminar mensajes vacíos
          .join('<br>');

        // Enviar correo
        await this.documentService.sendEmailDocumentExpirationDate(
          email,
          'Documentos vencidos y/o próximos a vencer',
          new Date().toISOString(),
          finalMessage,
        );
      }
    }

    this.logger.log('Tarea programada finalizada');
  }
}
