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

import { CreateGroupDto } from '@api/group/dto/create-group.dto';
import { ResultGroupDto } from '@api/group/dto/result-group.dto';
import { UpdateGroupDto } from '@api/group/dto/update-group.dto';
import { GroupService } from '@api/group/group.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'groups', version: '1' })
export class GroupController {
  public constructor(private readonly groupService: GroupService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createGroup(
    @Body() groupToCreateDto: CreateGroupDto,
  ): Promise<ResultGroupDto> {
    return this.groupService.createGroup(groupToCreateDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async getGroups(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('name') name?: string,
  ): Promise<{ items: ResultGroupDto[]; count: number }> {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.groupService.getGroups(page, size, name);
  }

  @Post('load-from-excel')
  @UseInterceptors(FileInterceptor('file'))
  public async loadGroupsFromExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ added: number }> {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo.');
    }

    const filePath = path.join('/tmp', file.originalname);
    await fs.writeFile(filePath, file.buffer);

    try {
      const groupsAdded = await this.groupService.loadGroupsFromExcel(filePath);
      return { added: groupsAdded };
    } finally {
      await fs.unlink(filePath);
    }
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateGroup(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<ResultGroupDto> {
    return this.groupService.updateGroup(id, updateGroupDto);
  }
}
