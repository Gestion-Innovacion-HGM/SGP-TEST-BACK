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

import { CreateHiringDto } from '@api/hiring/dto/create-hiring.dto';
import { ResultHiringDto } from '@api/hiring/dto/result-hiring.dto';
import { UpdateHiringDto } from '@api/hiring/dto/update-hiring.dto';
import { HiringService } from '@api/hiring/hiring.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'hirings', version: '1' })
export class HiringController {
  public constructor(private readonly hiringService: HiringService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createHiring(
    @Body() createHiringDto: CreateHiringDto,
  ): Promise<ResultHiringDto> {
    return this.hiringService.createHiring(createHiringDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findHirings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('type') type?: string,
  ): Promise<{ items: ResultHiringDto[]; count: number }> {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.hiringService.findHirings(page, size, type);
  }

  @Post('load-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  public async loadHiringsFromExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ added: number }> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    const filePath = path.join('/tmp', file.originalname);
    await fs.writeFile(filePath, file.buffer);

    try {
      const hiringsAdded =
        await this.hiringService.loadHiringsFromExcel(filePath);
      return { added: hiringsAdded };
    } finally {
      await fs.unlink(filePath);
    }
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateHiring(
    @Param('id') id: string,
    @Body() updateHiringDto: UpdateHiringDto,
  ): Promise<ResultHiringDto> {
    return this.hiringService.updateHiring(id, updateHiringDto);
  }
}
