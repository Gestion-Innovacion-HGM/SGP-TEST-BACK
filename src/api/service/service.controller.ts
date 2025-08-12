import { Category } from '@/domain/enums/category.enums';
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

import { CreateServiceDto } from '@api/service/dto/create-service.dto';
import { ResultServiceDto } from '@api/service/dto/result-service.dto';
import { UpdateServiceDto } from '@api/service/dto/update-service.dto';
import { ServiceService } from '@api/service/service.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'services', version: '1' })
export class ServiceController {
  public constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  async createService(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ResultServiceDto> {
    try {
      const {
        name,
        code,
        category,
        costCenter,
        qualificationDistinctiveNumber,
        groupName,
        profilesNames,
        locations,
        requisitesNames,
        isActive,
      } = createServiceDto;
      const createdService = await this.serviceService.createService(
        name,
        code,
        category,
        costCenter,
        qualificationDistinctiveNumber,
        groupName,
        profilesNames,
        locations,
        requisitesNames,
        isActive,
      );
      return createdService;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findServices(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('category') category?: Category,
    @Query('name') name?: string,
    @Query('code') code?: string,
    @Query('costCenter') costCenter?: string,
  ): Promise<{ items: ResultServiceDto[]; count: number }> {
    const codeNumber = code ? parseInt(code, 10) : undefined;
    // If size is 0 o -1, returns all the entries. The logic is managed in the service.
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return await this.serviceService.findServices(
      page,
      size,
      category,
      name,
      codeNumber,
      costCenter,
    );
  }

  @Post('load-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  async loadServicesFromExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    const filePath = path.join('/tmp', file.originalname);

    // Guardar el archivo temporalmente en el servidor
    await fs.writeFile(filePath, file.buffer);

    try {
      const servicesAdded =
        await this.serviceService.loadServicesFromExcel(filePath);
      return { servicesAdded };
    } finally {
      // Eliminar el archivo temporal
      await fs.unlink(filePath);
    }
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ResultServiceDto> {
    return this.serviceService.updateService(id, updateServiceDto);
  }

  @Get('by-group')
  public async findServicesByGroup(
    @Query('groupName') groupName: string,
  ): Promise<ResultServiceDto[]> {
    if (!groupName) {
      throw new BadRequestException('Group name is required.');
    }
    return this.serviceService.findServicesByGroupName(groupName);
  }
}
