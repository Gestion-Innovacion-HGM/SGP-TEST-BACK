import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ExpirationLog } from '@domain/expiration-log';

@Injectable()
export class ExpirationLogService {
  constructor(private readonly entityManager: EntityManager) {}

  // Registrar logs de expiración para múltiples documentos
  async logExpirations(data: {
    userId: string;
    documents: {
      documentName: string;
      idAttachment: string;
      expirationDate: Date | undefined;
      daysToExpiration: number;
    }[];
  }): Promise<void> {
    const expirationLog = new ExpirationLog();
    expirationLog.userId = data.userId;
    expirationLog.documents = data.documents.filter(
      (doc) => doc.expirationDate !== undefined,
    ) as {
      documentName: string;
      idAttachment: string;
      expirationDate: Date;
      daysToExpiration: number;
    }[];

    await this.entityManager.persistAndFlush(expirationLog);
  }

  // Consultar registros por usuario
  async getLogsByUser(userId: string): Promise<ExpirationLog[]> {
    return this.entityManager.find(ExpirationLog, { userId });
  }
}
