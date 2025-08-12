import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { TowerRepository } from '@infrastructure/repository/tower.repository';

import { CreateTowerDto } from '@api/tower/dto/create-tower.dto';
import { ResultTowerDto } from '@api/tower/dto/result-tower.dto';
import { UpdateTowerDto } from '@api/tower/dto/update-tower.dto';

@Injectable()
export class TowerService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly towerRepository: TowerRepository,
  ) {}

  /**
   * Creates a new tower with the given name.
   *
   * @param createTowerDto - The data for the new tower.
   * @returns A promise that resolves to the created tower entity.
   * @throws BadRequestException Thrown if a tower with the same name already exists.
   */
  public async createTower(
    createTowerDto: CreateTowerDto,
  ): Promise<ResultTowerDto> {
    const { name } = createTowerDto;
    const tower = await this.towerRepository.findOne({ name });
    if (tower !== null) {
      throw new BadRequestException(`La torre "${name}" ya existe.`);
    }
    const createdTower = this.towerRepository.create({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    await this.entityManager.persistAndFlush(createdTower);
    return plainToInstance(ResultTowerDto, wrap(createdTower).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves all towers with pagination and optional name filtering.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param name - Optional name filter for the towers.
   * @returns A promise that resolves to an object containing the array of tower items and the total count.
   * @throws BadRequestException Thrown if the page is less than 1 or if the size is less than 1 or greater than 50.
   */
  public async findTowers(
    page: number = 1,
    size?: number,
    name?: string,
  ): Promise<{ items: Array<ResultTowerDto>; count: number }> {
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

    const [towers, count] = await this.towerRepository.findAndCount(
      where as any,
      { limit: size, offset: offset, populate: ['*'] },
    );
    const items = towers.map((tower) =>
      plainToInstance(ResultTowerDto, wrap(tower).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Updates an existing tower.
   *
   * @param id - The ID of the tower to update.
   * @param updateTowerDto - The data to update the tower.
   * @returns The updated tower.
   * @throws NotFoundException If the tower is not found.
   * @throws BadRequestException If the new name is already in use.
   */
  public async updateTower(
    id: string,
    updateTowerDto: UpdateTowerDto,
  ): Promise<ResultTowerDto> {
    const tower = await this.towerRepository.findOne({ id });

    if (!tower) {
      throw new NotFoundException(`Tower with ID "${id}" not found.`);
    }

    if (updateTowerDto.name) {
      const existingTower = await this.towerRepository.findOne({
        name: updateTowerDto.name,
      });
      if (existingTower && existingTower.id !== id) {
        throw new BadRequestException(
          `A tower with the name "${updateTowerDto.name}" already exists.`,
        );
      }
      tower.name = updateTowerDto.name;
    }

    if (updateTowerDto.isActive !== undefined) {
      tower.isActive = updateTowerDto.isActive;
    }

    tower.updatedAt = new Date();

    await this.entityManager.persistAndFlush(tower);

    return plainToInstance(ResultTowerDto, wrap(tower).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
