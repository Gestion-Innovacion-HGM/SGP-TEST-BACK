import { Roles } from '@/common/security/decorator/roles.decorator';
import {
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

import { CreateUbicationDto } from '@api/ubication/dto/create-ubication.dto';
import { ResultUbicationDto } from '@api/ubication/dto/result-ubication.dto';
import { UpdateUbicationDto } from '@api/ubication/dto/update-ubication.dto';
import { UbicationService } from '@api/ubication/ubication.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'ubications', version: '1' })
export class UbicationController {
  constructor(private readonly ubicationService: UbicationService) {}

  @Post()
  @Roles(Role.SUPERUSER)
  async addUbication(
    @Body() createUbicationDto: CreateUbicationDto,
  ): Promise<ResultUbicationDto> {
    return this.ubicationService.addUbication(createUbicationDto);
  }

  @Post('uploadCSV')
  @Roles(Role.SUPERUSER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadUbications(@UploadedFile() file: Express.Multer.File) {
    return this.ubicationService.uploadUbicationsFromCSV(file);
  }

  @Get()
  async findAllUbications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ): Promise<{ items: ResultUbicationDto[]; count: number }> {
    return this.ubicationService.findAllUbications(page, size);
  }

  @Get('departments')
  async getAllDepartments(): Promise<string[]> {
    return await this.ubicationService.getAllDepartments();
  }

  @Get('departments/:department/municipalities')
  async getMunicipalitiesByDepartment(
    @Param('department') department: string,
  ): Promise<string[]> {
    return await this.ubicationService.getMunicipalitiesByDepartment(
      department,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateUbication(
    @Param('id') id: string,
    @Body() updateUbicationDto: UpdateUbicationDto,
  ): Promise<ResultUbicationDto> {
    return this.ubicationService.updateUbication(id, updateUbicationDto);
  }
}
