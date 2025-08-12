import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { parse } from 'fast-csv';
import { Readable } from 'stream';

import { UbicationRepository } from '@infrastructure/repository/ubication.repository';

import { CreateUbicationDto } from '@api/ubication/dto/create-ubication.dto';
import { ResultUbicationDto } from '@api/ubication/dto/result-ubication.dto';
import { UpdateUbicationDto } from '@api/ubication/dto/update-ubication.dto';

@Injectable()
export class UbicationService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly ubicationRepository: UbicationRepository,
  ) {}

  /**
   * Adds a new Ubication to the database.
   * @param createUbicationDto - The DTO (Data Transfer Object) containing the information for creating the Ubication.
   * @returns A Promise that resolves to the created Ubication entity.
   *
   * @throws BadRequestException if a Ubication with the same state and municipality already exists.
   */
  async addUbication(
    createUbicationDto: CreateUbicationDto,
  ): Promise<ResultUbicationDto> {
    const { region, daneStateCode, state, daneMunicipalityCode, municipality } =
      createUbicationDto;

    const existingUbication = await this.ubicationRepository.findOne({
      state,
      municipality,
    });

    if (existingUbication) {
      throw new BadRequestException(
        `La ubicación con estado '${state}' y municipio '${municipality}' ya existe.`,
      );
    }
    const ubication = this.ubicationRepository.create({
      region,
      daneStateCode,
      state,
      daneMunicipalityCode,
      municipality,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    await this.entityManager.persistAndFlush(ubication);
    return plainToInstance(ResultUbicationDto, wrap(ubication).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves all ubications with pagination.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @returns A promise that resolves to an object containing the array of ubications and the total count.
   *
   * @throws BadRequestException if the page or size values are invalid.
   */
  async findAllUbications(
    page: number = 1,
    size: number = 10,
  ): Promise<{ items: Array<ResultUbicationDto>; count: number }> {
    if (page < 1) {
      throw new BadRequestException('La pagina debe ser mayor a 0');
    }
    if (size < 1 || size > 50) {
      throw new BadRequestException(
        'El tamaño de la pagina debe ser mayor a 1 y menor que 50',
      );
    }
    const offset = (page - 1) * size;
    const [ubications, count] = await this.ubicationRepository.findAndCount(
      {},
      { limit: size, offset },
    );
    const items = ubications.map((ubication) =>
      plainToInstance(ResultUbicationDto, wrap(ubication).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return { items, count };
  }

  /**
   * Uploads ubications from a CSV file.
   *
   * @param file - The CSV file to upload.
   * @returns A Promise that resolves when the upload is complete.
   *
   * @throws If an existing ubications with the same state and municipality is found.
   */
  async uploadUbicationsFromCSV(file: Express.Multer.File): Promise<void> {
    const stream = Readable.from(file.buffer.toString());
    const ubications: CreateUbicationDto[] = [];

    return new Promise((resolve, reject) => {
      stream
        .pipe(parse({ headers: true }))
        .on('data', (row) => {
          const createUbicationDto: CreateUbicationDto = {
            region: row['REGION'],
            daneStateCode: parseInt(row['CÓDIGO DANE DEL DEPARTAMENTO'], 10),
            state: row['DEPARTAMENTO'],
            daneMunicipalityCode: parseInt(
              row['CÓDIGO DANE DEL MUNICIPIO'],
              10,
            ),
            municipality: row['MUNICIPIO'],
            isActive: true,
          };
          ubications.push(createUbicationDto);
        })
        .on('end', async () => {
          try {
            for (const ubicationDto of ubications) {
              const existingUbication = await this.ubicationRepository.findOne({
                state: ubicationDto.state,
                municipality: ubicationDto.municipality,
              });

              if (existingUbication) {
                throw new BadRequestException(
                  `La ubicación con estado '${ubicationDto.state}' y municipio '${ubicationDto.municipality}' ya existe.`,
                );
              }

              await this.addUbication(ubicationDto);
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Retrieves all departments from the ubication repository.
   * @returns A promise that resolves to an array of strings representing the unique departments.
   */
  async getAllDepartments(): Promise<string[]> {
    const departments = await this.ubicationRepository.findAll();
    const uniqueDepartments = [...new Set(departments.map((u) => u.state))];
    return uniqueDepartments;
  }

  /**
   * Retrieves the municipalities by department.
   * @param department - The department name.
   * @returns A promise that resolves to an array of strings representing the municipalities.
   *
   * @throws NotFoundException if no municipalities are found for the specified department.
   */
  async getMunicipalitiesByDepartment(department: string): Promise<string[]> {
    const municipalities = await this.ubicationRepository.find({
      state: department,
    });
    if (!municipalities.length) {
      throw new NotFoundException(
        `No municipalities found for department '${department}'`,
      );
    }
    return municipalities.map((u) => u.municipality);
  }

  /**
   * Updates an existing ubication.
   *
   * @param id - The ID of the ubication to update.
   * @param updateUbicationDto - The data to update the ubication.
   * @returns The updated ubication.
   * @throws NotFoundException If the ubication is not found.
   * @throws BadRequestException If the new state and municipality combination already exists.
   */
  public async updateUbication(
    id: string,
    updateUbicationDto: UpdateUbicationDto,
  ): Promise<ResultUbicationDto> {
    const ubication = await this.ubicationRepository.findOne({ id });

    if (!ubication) {
      throw new NotFoundException(`Ubication with ID "${id}" not found.`);
    }

    if (updateUbicationDto.state && updateUbicationDto.municipality) {
      const existingUbication = await this.ubicationRepository.findOne({
        state: updateUbicationDto.state,
        municipality: updateUbicationDto.municipality,
      });
      if (existingUbication && existingUbication.id !== id) {
        throw new BadRequestException(
          `Ubication with state "${updateUbicationDto.state}" and municipality "${updateUbicationDto.municipality}" already exists.`,
        );
      }
    }

    if (updateUbicationDto.region) ubication.region = updateUbicationDto.region;
    if (updateUbicationDto.daneStateCode)
      ubication.daneStateCode = updateUbicationDto.daneStateCode;
    if (updateUbicationDto.state) ubication.state = updateUbicationDto.state;
    if (updateUbicationDto.daneMunicipalityCode)
      ubication.daneMunicipalityCode = updateUbicationDto.daneMunicipalityCode;
    if (updateUbicationDto.municipality)
      ubication.municipality = updateUbicationDto.municipality;
    if (updateUbicationDto.isActive !== undefined)
      ubication.isActive = updateUbicationDto.isActive;

    ubication.updatedAt = new Date();

    await this.entityManager.persistAndFlush(ubication);

    return plainToInstance(ResultUbicationDto, wrap(ubication).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
