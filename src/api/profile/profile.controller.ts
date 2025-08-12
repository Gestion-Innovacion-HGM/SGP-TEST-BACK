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

import { CreateProfileDto } from '@api/profile/dto/create-profile.dto';
import { ResultProfileDto } from '@api/profile/dto/result-profile.dto';
import { UpdateProfileDto } from '@api/profile/dto/update-profile.dto';
import { ProfileService } from '@api/profile/profile.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'profiles', version: '1' })
export class ProfileController {
  public constructor(private readonly profileService: ProfileService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createProfile(
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<ResultProfileDto> {
    return this.profileService.createProfile(createProfileDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findProfiles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('name') name?: string,
  ): Promise<{ items: ResultProfileDto[]; count: number }> {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.profileService.findProfiles(page, size, name);
  }

  @Post('load-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  public async loadProfilesFromExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ added: number }> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    const filePath = path.join('/tmp', file.originalname);
    await fs.writeFile(filePath, file.buffer);

    try {
      const profilesAdded =
        await this.profileService.loadProfilesFromExcel(filePath);
      return { added: profilesAdded };
    } finally {
      await fs.unlink(filePath);
    }
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ResultProfileDto> {
    return this.profileService.updateProfile(id, updateProfileDto);
  }
}
