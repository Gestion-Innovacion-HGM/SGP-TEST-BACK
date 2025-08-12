import { Roles } from '@common/security/decorator/roles.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Res,
} from '@nestjs/common';
import { Request } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';

import { DocumentService } from '@api/document/document.service';

import { Role } from '@domain/enums/role.enums';
import { State } from '@domain/enums/state.enums';

interface CustomRequest extends ExpressRequest {
  user?: any;
}

@Controller({ path: 'documents', version: '1' })
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR, Role.COLLABORATOR)
  async findDocumentsById(
    @Param('id') id: string,
    @Request() request: CustomRequest,
  ) {
    const currentUser = request.user;
    console.info('Current User:', currentUser);

    if (!currentUser) {
      throw new BadRequestException('Current user is not defined.');
    }
    const documents = await this.documentService.findDocumentsById(
      id,
      currentUser,
    );

    if (!documents || documents.length === 0) {
      throw new NotFoundException(
        `No documents found for user with ID '${id}'.`,
      );
    }

    return documents;
  }

  @Get(':documentNumber/download/:documentName')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async downloadDocument(
    @Param('documentNumber') documentNumber: string,
    @Param('documentName') documentName: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } = await this.documentService.downloadDocument(
        documentNumber,
        documentName,
      );
      res.set({
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/pdf',
      });
      res.send(buffer);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':documentNumber/update-expiration/:documentName')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async updateDocumentExpiration(
    @Param('documentNumber') documentNumber: string,
    @Param('documentName') documentName: string,
    @Body('expirationDate') expirationDate: string,
  ) {
    try {
      const parsedExpirationDate = new Date(expirationDate);
      if (isNaN(parsedExpirationDate.getTime())) {
        throw new BadRequestException('Invalid expiration date.');
      }

      return await this.documentService.updateDocumentExpedition(
        documentNumber,
        documentName,
        parsedExpirationDate,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':userId/update-state/:documentName')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async updateDocumentState(
    @Param('userId') userId: string,
    @Param('documentName') documentName: string,
    @Body('state') state: State,
    @Body('rejectionMessage') rejectionMessage?: string,
  ) {
    try {
      if (!Object.values(State).includes(state)) {
        throw new BadRequestException(`Invalid state '${state}' provided.`);
      }

      return await this.documentService.updateDocumentState(
        userId,
        documentName,
        state,
        rejectionMessage,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
