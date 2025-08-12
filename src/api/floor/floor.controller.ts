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

import { CreateFloorDto } from '@api/floor/dto/create-floor.dto';
import { ResultFloorDto } from '@api/floor/dto/result-floor.dto';
import { UpdateFloorDto } from '@api/floor/dto/update-floor.dto';
import { FloorService } from '@api/floor/floor.service';

import { Role } from '@domain/enums/role.enums';

@Controller({ path: 'floors', version: '1' })
export class FloorController {
  public constructor(private readonly floorService: FloorService) {}

  @Post()
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async createFloor(
    @Body() createFloorDto: CreateFloorDto,
  ): Promise<ResultFloorDto> {
    return this.floorService.createFloor(createFloorDto);
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async getFloors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('name') name?: string,
  ): Promise<{ items: ResultFloorDto[]; count: number }> {
    // If size is 0 or -1, returns all the entries. The logic is managed in the service.
    if (size === 0 || size === -1) {
      size = undefined;
    }
    return this.floorService.findFloors(page, size, name);
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateFloor(
    @Param('id') id: string,
    @Body() updateFloorDto: UpdateFloorDto,
  ): Promise<ResultFloorDto> {
    return this.floorService.updateFloor(id, updateFloorDto);
  }
}
