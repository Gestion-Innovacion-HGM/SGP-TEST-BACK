import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as ExcelJS from 'exceljs';

import { HiringRepository } from '@infrastructure/repository/hiring.repository';
import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';

import { CreateHiringDto } from '@api/hiring/dto/create-hiring.dto';
import { ResultHiringDto } from '@api/hiring/dto/result-hiring.dto';

import { UpdateHiringDto } from './dto/update-hiring.dto';

@Injectable()
export class HiringService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly hiringRepository: HiringRepository,
    private readonly requisiteRepository: RequisiteRepository,
  ) {}

  /**
   * Creates a new hiring with the specified type and requisites.
   *
   * @param type - The type of the hiring.
   * @param requisiteNames - An array of requisite names for the hiring.
   * @returns A promise that resolves to the created hiring.
   *
   * @throws BadRequestException
   * Thrown if the hiring type is invalid,
   * Thrown if the requisite names are missing,
   * Thrown if any of the requisite names do not exist.
   */
  public async createHiring(
    createHiringDto: CreateHiringDto,
  ): Promise<ResultHiringDto> {
    const { type, requisitesNames, isActive } = createHiringDto;
    const hiring = await this.hiringRepository.findOne({ type });
    if (hiring !== null) {
      throw new BadRequestException(`Tipo contrato "${type}" es invalido`);
    }
    if (requisitesNames.length < 1) {
      throw new BadRequestException(
        `El tipo de contrato "${type}" debe tener al menos un requisito`,
      );
    }
    const foundRequisites = await this.requisiteRepository.find({
      name: { $in: requisitesNames },
    });
    if (foundRequisites.length !== new Set(requisitesNames).size) {
      throw new BadRequestException('No se permiten requisitos duplicados');
    }
    const missingRequisites = requisitesNames.filter(
      (name: string) =>
        !foundRequisites.some((requisite) => requisite.name === name),
    );
    if (missingRequisites.length > 0) {
      throw new BadRequestException(
        `Los siguientes requisitos no existen: ${missingRequisites.join(', ')}`,
      );
    }
    const createdHiring = this.hiringRepository.create({
      type,
      requisites: foundRequisites,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive,
    });
    await this.entityManager.persistAndFlush(createdHiring);
    return plainToInstance(ResultHiringDto, wrap(createdHiring).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves all hirings with pagination.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param type - Optional contract type filter.
   * @returns A promise that resolves to an object containing the array of hirings and the total count.
   *
   * @throws BadRequestException
   * Thrown if the page or size values are invalid.
   */
  public async findHirings(
    page: number = 1,
    size?: number,
    type?: string,
  ): Promise<{ items: Array<ResultHiringDto>; count: number }> {
    if (page < 1) {
      throw new BadRequestException('La página debe ser mayor o igual a 1');
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual a 50',
      );
    }
    const offset = (page - 1) * (size ?? 0);
    const where = type ? { type: { $regex: new RegExp(type, 'i') } } : {};

    const [hirings, count] = await this.hiringRepository.findAndCount(
      where as any,
      { limit: size, offset, populate: ['*'] },
    );
    const items = hirings.map((hiring) =>
      plainToInstance(ResultHiringDto, wrap(hiring).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Loads hirings from an Excel file.
   *
   * @param filePath - The path to the Excel file.
   * @returns A promise that resolves to the number of hirings added.
   *
   * @throws {BadRequestException} If no valid contracts are found in the file.
   * @throws {BadRequestException} If a contract type has no associated requisites.
   * @throws {BadRequestException} If some requisites do not exist.
   */
  public async loadHiringsFromExcel(filePath: string): Promise<number> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no contiene datos.');
    }

    const hiringsMap: Record<
      string,
      { requisites: Set<string>; isActive: boolean }
    > = {};

    // Procesar filas, omitiendo el encabezado
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Saltar encabezado
        const type = row.getCell(1).value?.toString().trim();
        const requisite = row.getCell(2).value?.toString().trim();
        const isActiveCell = row
          .getCell(3)
          .value?.toString()
          .trim()
          .toLowerCase();

        const isActive = isActiveCell === 'true';

        if (type && requisite) {
          if (!hiringsMap[type]) {
            hiringsMap[type] = { requisites: new Set<string>(), isActive };
          }

          hiringsMap[type].requisites.add(requisite);

          // Asegurar que el estado isActive se sincroniza correctamente
          hiringsMap[type].isActive = isActive;
        }
      }
    });

    const hiringsArray = Object.keys(hiringsMap).map((type) => ({
      type,
      requisitesNames: Array.from(hiringsMap[type].requisites),
      isActive: hiringsMap[type].isActive,
    }));

    if (hiringsArray.length === 0) {
      throw new BadRequestException(
        'No se encontraron contratos válidos en el archivo.',
      );
    }

    let hiringsAdded = 0;

    for (const hiringData of hiringsArray) {
      const existingHiring = await this.hiringRepository.findOne({
        type: hiringData.type,
      });

      const foundRequisites = await this.requisiteRepository.find({
        name: { $in: hiringData.requisitesNames },
      });

      if (foundRequisites.length !== hiringData.requisitesNames.length) {
        const missingRequisites = hiringData.requisitesNames.filter(
          (name) =>
            !foundRequisites.some((requisite) => requisite.name === name),
        );
        console.log(
          `Los siguientes requisitos no existen: "${hiringData.type}": ${missingRequisites.join(', ')} `,
        );
        continue;
      }

      if (existingHiring) {
        foundRequisites.forEach((requisite) => {
          existingHiring.requisites.add(requisite);
        });
      } else {
        const createdHiring = this.hiringRepository.create({
          type: hiringData.type,
          isActive: hiringData.isActive,
          requisites: foundRequisites,
        });
        await this.entityManager.persistAndFlush(createdHiring);
        hiringsAdded++;
      }
    }

    return hiringsAdded;
  }

  /**
   * Updates an existing hiring.
   *
   * @param id - The ID of the hiring to update.
   * @param updateHiringDto - The data to update the hiring.
   * @returns The updated hiring.
   * @throws NotFoundException If the hiring is not found.
   * @throws BadRequestException If the requisite names are invalid.
   */
  public async updateHiring(
    id: string,
    updateHiringDto: UpdateHiringDto,
  ): Promise<ResultHiringDto> {
    const hiring = await this.hiringRepository.findOne({ id });

    if (!hiring) {
      throw new NotFoundException(`Hiring with ID "${id}" not found.`);
    }

    if (updateHiringDto.type) {
      const existingHiring = await this.hiringRepository.findOne({
        type: updateHiringDto.type,
      });
      if (existingHiring && existingHiring.id !== id) {
        throw new BadRequestException(
          `A hiring with the type "${updateHiringDto.type}" already exists.`,
        );
      }
      hiring.type = updateHiringDto.type;
    }

    if (updateHiringDto.isActive !== undefined) {
      hiring.isActive = updateHiringDto.isActive;
    }

    if (updateHiringDto.requisitesNames) {
      const foundRequisites = await this.requisiteRepository.find({
        name: { $in: updateHiringDto.requisitesNames },
      });

      if (
        foundRequisites.length !== new Set(updateHiringDto.requisitesNames).size
      ) {
        throw new BadRequestException(
          'Some requisites are invalid or duplicates.',
        );
      }

      hiring.requisites.set(foundRequisites);
    }

    hiring.updatedAt = new Date();

    await this.entityManager.persistAndFlush(hiring);

    return plainToInstance(ResultHiringDto, wrap(hiring).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
