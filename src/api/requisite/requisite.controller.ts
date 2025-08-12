import { Roles } from '@common/security/decorator/roles.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { promises as fs } from 'fs';
import * as path from 'path';

import { CreateRequisiteDto } from '@api/requisite/dto/create-requisite.dto';
import { ResultRequisiteDto } from '@api/requisite/dto/result-requisite.dto';
import { UpdateRequisiteDto } from '@api/requisite/dto/update-requisite.dto';
import { RequisiteService } from '@api/requisite/requisite.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'requisites', version: '1' })
export class RequisiteController {
  public constructor(private readonly requisiteService: RequisiteService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createRequisite(
    @Body() createRequisiteDto: CreateRequisiteDto,
  ): Promise<ResultRequisiteDto> {
    return this.requisiteService.createRequisite(createRequisiteDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findRequisites(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('name') name?: string,
  ): Promise<{ items: ResultRequisiteDto[]; count: number }> {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return await this.requisiteService.findRequisites(page, size, name);
  }

  @Post('load-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  public async loadRequisitesFromExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ added: number }> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    const filePath = path.join('/tmp', file.originalname);

    // Guardar el archivo temporalmente en el servidor
    await fs.writeFile(filePath, file.buffer);

    try {
      const requisitesAdded =
        await this.requisiteService.loadRequisitesFromExcel(filePath);

      return { added: requisitesAdded };
    } finally {
      // Eliminar el archivo temporal
      await fs.unlink(filePath);
    }
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateRequisite(
    @Param('id') id: string,
    @Body() updateRequisiteDto: UpdateRequisiteDto,
  ): Promise<ResultRequisiteDto> {
    return this.requisiteService.updateRequisite(id, updateRequisiteDto);
  }
}
