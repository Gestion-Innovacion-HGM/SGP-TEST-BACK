import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as ExcelJS from 'exceljs';

import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';

import { CreateRequisiteDto } from '@api/requisite/dto/create-requisite.dto';
import { ResultRequisiteDto } from '@api/requisite/dto/result-requisite.dto';
import { UpdateRequisiteDto } from '@api/requisite/dto/update-requisite.dto';

import { ValidityUnit } from '@domain/enums/validity-unit.enums';

@Injectable()
export class RequisiteService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly requisiteRepository: RequisiteRepository,
  ) {}

  /**
   * Creates a new requisite based on the provided DTO.
   *
   * @param createRequisiteDto - The data transfer object containing the details of the requisite to be created.
   * @returns A promise that resolves to a ResultRequisiteDto containing the details of the created requisite.
   *
   * @throws BadRequestException - If `isValidityRequired` is true and either `validityValue` or `validityUnit` is undefined.
   * @throws BadRequestException - If a requisite with the same name already exists.
   */
  public async createRequisite(
    createRequisiteDto: CreateRequisiteDto,
  ): Promise<ResultRequisiteDto> {
    const {
      name,
      format,
      description,
      isValidityRequired,
      validityValue,
      validityUnit,
    } = createRequisiteDto;

    if (
      isValidityRequired &&
      (validityValue === undefined || validityUnit === undefined)
    ) {
      throw new BadRequestException(
        'Debe proporcionar validityValue y validityUnit cuando isValidityRequired es true.',
      );
    }

    const requisite = await this.requisiteRepository.findOne({ name });
    if (requisite !== null) {
      throw new BadRequestException(`El requisito "${name}" ya existe.`);
    }

    const createdRequisite = this.requisiteRepository.create({
      name,
      format,
      description,
      isActive: true,
      isValidityRequired: isValidityRequired ?? false,
      validityValue: validityValue ?? 0,
      validityUnit: validityUnit ?? ValidityUnit.DAY,
    });
    await this.entityManager.persistAndFlush(createdRequisite);
    return plainToInstance(
      ResultRequisiteDto,
      wrap(createdRequisite).toObject(),
      { exposeDefaultValues: true, excludeExtraneousValues: true },
    );
  }

  /**
   * Retrieves all requisites with pagination support.
   *
   * @param page - The page number to retrieve (default: 1).
   * @param size - The number of requisites per page (default: 10).
   * @param name - The name of the requisite to filter by (optional).
   * @returns A promise that resolves to an object containing the items and count.
   *
   * @throws BadRequestException
   * Thrown if the page number or size is invalid.
   */
  public async findRequisites(
    page: number = 1,
    size?: number,
    name?: string,
  ): Promise<{ items: Array<ResultRequisiteDto>; count: number }> {
    if (page < 1) {
      throw new BadRequestException(
        'El número de página debe ser mayor o igual a 1',
      );
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual que 50',
      );
    }
    const offset = (page - 1) * (size ?? 0);
    const where = name ? { name: { $regex: new RegExp(name, 'i') } } : {};

    const [requisites, count] = await this.requisiteRepository.findAndCount(
      where as any,
      { offset, limit: size, populate: ['*'] },
    );
    const items = requisites.map((requisite) =>
      plainToInstance(ResultRequisiteDto, wrap(requisite).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Loads requisites from an Excel file and stores them in the database.
   *
   * @param filePath - The path to the Excel file containing the requisites.
   * @returns A promise that resolves to the number of requisites added.
   *
   * @throws BadRequestException if the file cannot be read or no valid requisites are found.
   */
  public async loadRequisitesFromExcel(filePath: string): Promise<number> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no contiene datos.');
    }

    // Extraer los datos de las filas, asumiendo que la primera fila es un encabezado
    const requisites: {
      name: string;
      description: string;
      isValidityRequired: boolean;
      validityValue: number;
      validityUnit: ValidityUnit;
      isActive: boolean;
    }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Saltar el encabezado
        const name = row.getCell(1).value?.toString().trim() || '';
        const description = row.getCell(2).value?.toString().trim() || '';
        const isValidityRequired =
          row.getCell(3).value?.toString().trim().toLowerCase() === 'true' ||
          false;
        const validityValue =
          parseInt(row.getCell(4).value?.toString().trim() || '') | 0;
        const validityUnit =
          ValidityUnit[
            row.getCell(5).value?.toString().trim() as keyof typeof ValidityUnit
          ];
        const isActive =
          row.getCell(6).value?.toString().trim().toLowerCase() === 'true';
        if (name) {
          requisites.push({
            name,
            description,
            isValidityRequired,
            validityValue,
            validityUnit,
            isActive,
          });
        }
      }
    });

    if (requisites.length === 0) {
      throw new BadRequestException(
        'No se encontraron requisitos válidos en el archivo.',
      );
    }

    let requisitesAdded = 0;
    for (const requisite of requisites) {
      const requisiteExists = await this.requisiteRepository.findOne({
        name: requisite.name,
      });
      if (!requisiteExists) {
        const createRequisiteDto = new CreateRequisiteDto();
        createRequisiteDto.name = requisite.name;
        createRequisiteDto.description = requisite.description;
        createRequisiteDto.isValidityRequired = requisite.isValidityRequired;
        createRequisiteDto.validityValue = requisite.validityValue;
        createRequisiteDto.validityUnit = requisite.validityUnit;
        createRequisiteDto.isActive = requisite.isActive;

        const createdRequisite =
          this.requisiteRepository.create(createRequisiteDto);
        await this.entityManager.persistAndFlush(createdRequisite);
        requisitesAdded++;
      }
    }

    return requisitesAdded;
  }

  /**
   * Updates an existing requisite with the provided data.
   *
   * @param {string} id - The ID of the requisite to update.
   * @param {UpdateRequisiteDto} updateRequisiteDto - The data to update the requisite with.
   * @returns {Promise<ResultRequisiteDto>} - The updated requisite data.
   *
   * @throws {NotFoundException} - If the requisite with the given ID is not found.
   * @throws {BadRequestException} - If `isValidityRequired` is true and either `validityValue` or `validityUnit` is not provided,
   * @throws if a requisite with the provided name already exists.
   */
  public async updateRequisite(
    id: string,
    updateRequisiteDto: UpdateRequisiteDto,
  ): Promise<ResultRequisiteDto> {
    const {
      name,
      format,
      description,
      isActive,
      isValidityRequired,
      validityValue,
      validityUnit,
    } = updateRequisiteDto;

    const requisite = await this.requisiteRepository.findOne({ id });
    if (!requisite) {
      throw new NotFoundException(`Requisite with ID "${id}" not found.`);
    }

    if (
      isValidityRequired &&
      (validityValue === undefined || validityUnit === undefined)
    ) {
      throw new BadRequestException(
        'Debe proporcionar validityValue y validityUnit cuando isValidityRequired es true.',
      );
    }

    if (name) {
      const existingRequisite = await this.requisiteRepository.findOne({
        name,
      });
      if (existingRequisite && existingRequisite.id !== id) {
        throw new BadRequestException(
          `A requisite with the name "${name}" already exists.`,
        );
      }
      requisite.name = name;
    }

    requisite.format = format ?? requisite.format;
    requisite.description = description ?? requisite.description;
    requisite.isActive = isActive !== undefined ? isActive : requisite.isActive;
    requisite.isValidityRequired = isValidityRequired;
    requisite.validityValue = validityValue ?? requisite.validityValue;
    requisite.validityUnit = validityUnit ?? requisite.validityUnit;
    requisite.updatedAt = new Date();

    await this.entityManager.persistAndFlush(requisite);

    return plainToInstance(ResultRequisiteDto, wrap(requisite).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
