import { Roles } from '@common/security/decorator/roles.decorator';
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
} from '@nestjs/common';

import { CreateTowerDto } from '@api/tower/dto/create-tower.dto';
import { ResultTowerDto } from '@api/tower/dto/result-tower.dto';
import { UpdateTowerDto } from '@api/tower/dto/update-tower.dto';
import { TowerService } from '@api/tower/tower.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'towers', version: '1' })
export class TowerController {
  public constructor(private readonly towerService: TowerService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createTower(
    @Body() createTowerDto: CreateTowerDto,
  ): Promise<ResultTowerDto> {
    return this.towerService.createTower(createTowerDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findTowers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('name') name?: string,
  ): Promise<{ items: ResultTowerDto[]; count: number }> {
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.towerService.findTowers(page, size, name);
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateTower(
    @Param('id') id: string,
    @Body() updateTowerDto: UpdateTowerDto,
  ): Promise<ResultTowerDto> {
    return this.towerService.updateTower(id, updateTowerDto);
  }
}
