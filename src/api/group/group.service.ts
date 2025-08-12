import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as ExcelJS from 'exceljs';

import { GroupRepository } from '@infrastructure/repository/group.repository';

import { CreateGroupDto } from '@api/group/dto/create-group.dto';
import { ResultGroupDto } from '@api/group/dto/result-group.dto';
import { UpdateGroupDto } from '@api/group/dto/update-group.dto';

@Injectable()
export class GroupService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly groupRepository: GroupRepository,
  ) {}

  /**
   * Creates a new group with the given name.
   *
   * @param name - The name of the group to create.
   * @returns A Promise that resolves to the created group.
   *
   * @throws BadRequestException
   * Thrown if the group name is already in use.
   */
  public async createGroup(
    createGroupDto: CreateGroupDto,
  ): Promise<ResultGroupDto> {
    const { name } = createGroupDto;
    const group = await this.groupRepository.findOne({ name });
    if (group !== null) {
      throw new BadRequestException(`El nombre "${name}" ya está en uso`);
    }
    const createdGroup = this.groupRepository.create(createGroupDto);
    await this.entityManager.persistAndFlush(createdGroup);
    return plainToInstance(ResultGroupDto, wrap(createdGroup).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves groups with pagination and optional name filtering.
   *
   * @param page - The page number to retrieve (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param name - Optional name filter for the groups.
   * @returns A promise that resolves to an object containing the array of group items and the total count.
   *
   * @throws BadRequestException
   * Thrown if the page number is less than 1 or the size is less than 1 or greater than 50.
   */
  public async getGroups(
    page: number = 1,
    size?: number,
    name?: string,
  ): Promise<{ items: ResultGroupDto[]; count: number }> {
    if (page < 1) {
      throw new BadRequestException('La página debe ser mayor o igual a 1');
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual a 50',
      );
    }
    const offset = (page - 1) * (size ?? 0);
    const where = name ? { name: { $regex: new RegExp(name, 'i') } } : {};

    const [groups, count] = await this.groupRepository.findAndCount(
      where as any,
      { limit: size, offset: offset, populate: ['*'] },
    );
    const items = groups.map((group) =>
      plainToInstance(ResultGroupDto, wrap(group).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Loads groups from an Excel file and stores them in the database.
   *
   * @param filePath - The path to the Excel file containing the groups.
   * @returns A promise that resolves to the number of groups added.
   *
   * @throws BadRequestException if the file cannot be read or no valid groups are found.
   */
  public async loadGroupsFromExcel(filePath: string): Promise<number> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no contiene datos.');
    }

    const groups: {
      name: string;
      isActive: boolean;
    }[] = [];

    // Intentar encontrar la columna que corresponde a los grupos
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const name = row.getCell(1).value?.toString().trim() || '';
        const isActive =
          row.getCell(2).value?.toString().trim().toLowerCase() === 'true';

        if (name) {
          groups.push({ name, isActive });
        }
      }
    });

    if (groups.length === 0) {
      throw new BadRequestException(
        'No se encontraron requisitos validos en el archivo.',
      );
    }
    let groupsAdded = 0;
    for (const group of groups) {
      const groupExists = await this.groupRepository.findOne({
        name: group.name,
      });
      if (!groupExists) {
        const createGroupDto = new CreateGroupDto();
        createGroupDto.name = group.name;
        createGroupDto.isActive = group.isActive;

        const createdGroup = this.groupRepository.create(createGroupDto);
        await this.entityManager.persistAndFlush(createdGroup);
        groupsAdded++;
      }
    }

    return groupsAdded;
  }

  /**
   * Updates an existing group.
   *
   * @param id - The ID of the group to update.
   * @param updateGroupDto - The data for updating the group.
   * @returns The updated group.
   *
   * @throws NotFoundException If the group is not found.
   * @throws BadRequestException If a group with the same name already exists.
   */
  public async updateGroup(
    id: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<ResultGroupDto> {
    const group = await this.groupRepository.findOne({ id });

    if (!group) {
      throw new NotFoundException(`Group with ID "${id}" not found.`);
    }

    if (updateGroupDto.name) {
      const existingGroup = await this.groupRepository.findOne({
        name: updateGroupDto.name,
      });
      if (existingGroup && existingGroup.id !== id) {
        throw new BadRequestException(
          `A group with the name "${updateGroupDto.name}" already exists.`,
        );
      }
      group.name = updateGroupDto.name;
    }

    if (updateGroupDto.isActive !== undefined) {
      group.isActive = updateGroupDto.isActive;
    }

    group.updatedAt = new Date();

    await this.entityManager.persistAndFlush(group);

    return plainToInstance(ResultGroupDto, wrap(group).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
