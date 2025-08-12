import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { FloorRepository } from '@infrastructure/repository/floor.repository';

import { CreateFloorDto } from '@api/floor/dto/create-floor.dto';
import { ResultFloorDto } from '@api/floor/dto/result-floor.dto';
import { UpdateFloorDto } from '@api/floor/dto/update-floor.dto';

@Injectable()
export class FloorService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly floorRepository: FloorRepository,
  ) {}

  /**
   * Creates a new floor with the given name.
   *
   * @param createFloorDto - The data for the new floor.
   * @returns A promise that resolves to the created floor entity.
   * @throws BadRequestException Thrown if a floor with the same name already exists.
   */
  public async createFloor(
    createFloorDto: CreateFloorDto,
  ): Promise<ResultFloorDto> {
    const { name } = createFloorDto;
    const floor = await this.floorRepository.findOne({ name });
    if (floor !== null) {
      throw new BadRequestException(`El piso "${name}" ya existe.`);
    }
    const createdFloor = this.floorRepository.create({
      name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.entityManager.persistAndFlush(createdFloor);
    return plainToInstance(ResultFloorDto, wrap(createdFloor).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves all floors with pagination and optional name filtering.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param name - Optional name filter for the floors.
   * @returns A promise that resolves to an object containing the array of floor items and the total count.
   * @throws BadRequestException Thrown if the page is less than 1 or if the size is less than 1 or greater than 50.
   */
  public async findFloors(
    page: number = 1,
    size?: number,
    name?: string,
  ): Promise<{ items: Array<ResultFloorDto>; count: number }> {
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

    const [floors, count] = await this.floorRepository.findAndCount(
      where as any,
      { limit: size, offset: offset, populate: ['*'] },
    );
    const items = floors.map((floor) =>
      plainToInstance(ResultFloorDto, wrap(floor).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Updates the details of an existing floor.
   *
   * @param id - The unique identifier of the floor to be updated.
   * @param updateFloorDto - The data transfer object containing the updated floor details.
   * @returns A promise that resolves to the updated floor details.
   *
   * @throws NotFoundException - If the floor with the specified ID is not found.
   * @throws BadRequestException - If a floor with the specified name already exists.
   */
  public async updateFloor(
    id: string,
    updateFloorDto: UpdateFloorDto,
  ): Promise<ResultFloorDto> {
    const floor = await this.floorRepository.findOne({ id });

    if (!floor) {
      throw new NotFoundException(`El piso con ID "${id}" no fue encontrado.`);
    }

    if (updateFloorDto.name) {
      const existingFloor = await this.floorRepository.findOne({
        name: updateFloorDto.name,
      });
      if (existingFloor && existingFloor.id !== id) {
        throw new BadRequestException(
          `Ya existe un piso con el nombre "${updateFloorDto.name}".`,
        );
      }
      floor.name = updateFloorDto.name;
    }

    if (updateFloorDto.isActive !== undefined) {
      floor.isActive = updateFloorDto.isActive;
    }

    floor.updatedAt = new Date();

    await this.entityManager.persistAndFlush(floor);

    return plainToInstance(ResultFloorDto, wrap(floor).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
