import { Roles } from '@common/security/decorator/roles.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { AttachmentService } from '@api/attachment/attachment.service';
import { ResultAttachmentDto } from '@api/attachment/dto/result-attachment.dto';
import { UpdateAttachmentDto } from '@api/attachment/dto/update-attachment.dto';

import { StatusAttachment } from '@domain/enums/attachment.enums';
import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'attachments', version: '1' })
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR, Role.COLLABORATOR)
  @UseInterceptors(FileInterceptor('file'))
  async createAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('documentName') documentName: string,
    @Body('expeditionDate') expeditionDate?: string,
  ): Promise<ResultAttachmentDto> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    userId = userId.trim();
    documentName = documentName.trim();
    expeditionDate = expeditionDate?.trim();

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo subido no es un PDF.');
    }

    return await this.attachmentService.createAttachment(
      file,
      userId,
      documentName,
      expeditionDate,
    );
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR, Role.COLLABORATOR)
  async findAllAttachment(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ) {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.attachmentService.findAllAttachment(page, size);
  }

  @Get(':userId')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async findAttachmentsByUserId(
    @Param('userId') userId: string,
  ): Promise<ResultAttachmentDto[]> {
    const attachments =
      await this.attachmentService.findAttachmentsByUserId(userId);

    if (!attachments || attachments.length === 0) {
      throw new NotFoundException(
        `No attachments found for user with ID '${userId}'.`,
      );
    }

    return attachments;
  }

  @Get(':userId/download/:filename')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async downloadAttachment(
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const fileBuffer = await this.attachmentService.downloadAttachment(
      userId,
      filename,
    );

    if (!fileBuffer) {
      throw new NotFoundException(
        `Attachment with filename '${filename}' not found.`,
      );
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(fileBuffer);
  }

  @Patch('expedition-date')
  async updateExpeditionDate(
    @Body('documentNumber') documentNumber: string,
    @Body('documentName') documentName: string,
    @Body('filename') filename: string,
    @Body('expeditionDate') expeditionDate: string,
  ): Promise<{ result: ResultAttachmentDto; expirationMessage: string }> {
    if (!expeditionDate) {
      throw new BadRequestException('Expedition date is required.');
    }
    const expeditionDateParsed = new Date(expeditionDate);
    if (isNaN(expeditionDateParsed.getTime())) {
      throw new BadRequestException('Invalid expedition date format.');
    }

    const { result, expirationMessage } =
      await this.attachmentService.updateExpeditionDate(
        documentNumber,
        documentName,
        filename,
        expeditionDateParsed,
      );

    return {
      result,
      expirationMessage,
    };
  }

  @Patch(':documentNumber/:filename/status')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async updateAttachmentStatus(
    @Param('documentNumber') documentNumber: string,
    @Param('filename') filename: string,
    @Body('status') status: StatusAttachment,
  ): Promise<ResultAttachmentDto> {
    return this.attachmentService.updateAttachmentStatus(
      documentNumber,
      filename,
      status,
    );
  }

  @Patch(':userId/:documentName/replace')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR, Role.COLLABORATOR)
  @UseInterceptors(FileInterceptor('file'))
  async replaceAttachment(
    @Param('userId') userId: string,
    @Param('documentName') documentName: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResultAttachmentDto> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    return this.attachmentService.replaceAttachment(userId, documentName, file);
  }

  @Post('send-email')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR, Role.COLLABORATOR)
  async sendEmailNotification(
    @Body('email') email: string,
    @Body('userId') userId: string,
    @Body('details') details: string,
    @Body('messageType') messageType: 'collaborator' | 'revisor',
    @Req() req: any,
  ): Promise<string> {
    if (!email || !details || !userId || !messageType) {
      throw new BadRequestException(
        'El correo electrónico, ID de usuario, detalles del usuario y tipo de mensaje son requeridos.',
      );
    }

    const currentUser = req.user;

    await this.attachmentService.sendEmailNotification(
      email,
      userId,
      details,
      currentUser,
      messageType,
    );

    return 'Correo electrónico de notificación enviado exitosamente.';
  }

  @Patch(':filename')
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  async updateAttachment(
    @Param('filename') filename: string,
    @Body() updateData: UpdateAttachmentDto,
  ): Promise<ResultAttachmentDto> {
    return this.attachmentService.updateAttachment(filename, updateData);
  }
}
