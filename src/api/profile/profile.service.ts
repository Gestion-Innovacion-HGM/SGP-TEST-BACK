import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as ExcelJS from 'exceljs';

import { ProfileRepository } from '@infrastructure/repository/profile.repository';
import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';

import { CreateProfileDto } from '@api/profile/dto/create-profile.dto';
import { ResultProfileDto } from '@api/profile/dto/result-profile.dto';
import { UpdateProfileDto } from '@api/profile/dto/update-profile.dto';

@Injectable()
export class ProfileService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly profileRepository: ProfileRepository,
    private readonly requisiteRepository: RequisiteRepository,
  ) {}

  /**
   * Creates a new profile with the given name and requisites.
   *
   * @param name - The name of the profile.
   * @param requisiteNames - The names of the requisites.
   * @returns A promise that resolves to the created profile.
   *
   * @throws BadRequestException
   * Thrown if the profile name is invalid or
   * Thrown if the profile does not have any requisites.
   * Thrown if any of the requisites does not exist.
   */
  public async createProfile(
    createProfileDto: CreateProfileDto,
  ): Promise<ResultProfileDto> {
    const { name, requisitesNames, isActive } = createProfileDto;

    const existingProfile = await this.profileRepository.findOne({ name });
    if (existingProfile) {
      throw new BadRequestException(`El Perfil "${name}" ya existe.`);
    }

    const requisites = await this.requisiteRepository.find({
      name: { $in: requisitesNames },
    });

    if (requisites.length !== requisitesNames.length) {
      const missingRequisites = requisitesNames.filter(
        (name) => !requisites.some((req) => req.name === name),
      );
      throw new BadRequestException(
        `Los siguientes requisitos no existen: ${missingRequisites.join(', ')}`,
      );
    }

    const createdProfile = this.profileRepository.create({
      name,
      requisites,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive,
    });

    await this.entityManager.persistAndFlush(createdProfile);
    return plainToInstance(ResultProfileDto, wrap(createdProfile).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves profiles with pagination and optional filtering by name.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param name - The optional name filter for the profiles.
   * @returns A promise that resolves to an object containing the items and count.
   *
   * @throws BadRequestException
   * Thrown if the page or size is invalid.
   */
  public async findProfiles(
    page: number = 1,
    size?: number,
    name?: string,
  ): Promise<{ items: ResultProfileDto[]; count: number }> {
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

    const [profiles, count] = await this.profileRepository.findAndCount(
      where as any,
      { limit: size, offset, populate: ['requisites'] },
    );

    const items = profiles.map((profile) =>
      plainToInstance(ResultProfileDto, wrap(profile).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );

    return { items, count };
  }

  public async loadProfilesFromExcel(filePath: string): Promise<number> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no contiene datos.');
    }

    // Mapa para almacenar perfiles y sus requisitos
    const profilesMap: Record<
      string,
      { requisites: Set<string>; isActive: boolean }
    > = {};

    // Procesar filas, omitiendo el encabezado
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Saltar encabezado
        const name = row.getCell(1).value?.toString().trim();
        const requisite = row.getCell(2).value?.toString().trim();
        const isActive =
          row.getCell(3).value?.toString().trim().toLowerCase() === 'true';

        if (name && requisite) {
          if (!profilesMap[name]) {
            profilesMap[name] = { requisites: new Set<string>(), isActive };
          }
          profilesMap[name].requisites.add(requisite);
          profilesMap[name].isActive = isActive;
        }
      }
    });

    const profilesArray = Object.keys(profilesMap).map((name) => ({
      name,
      requisitesNames: Array.from(profilesMap[name].requisites),
      isActive: profilesMap[name].isActive,
    }));

    if (profilesArray.length === 0) {
      throw new BadRequestException(
        'No se encontraron perfiles válidos en el archivo.',
      );
    }

    let profilesAdded = 0;

    for (const profileData of profilesArray) {
      const existingProfile = await this.profileRepository.findOne({
        name: profileData.name,
      });

      const requisites = await this.requisiteRepository.find({
        name: { $in: profileData.requisitesNames },
      });

      if (requisites.length !== profileData.requisitesNames.length) {
        const missingRequisites = profileData.requisitesNames.filter(
          (reqName) => !requisites.some((r) => r.name === reqName),
        );
        console.log(
          `Requisitos faltantes para el perfil "${profileData.name}": ${missingRequisites.join(', ')}`,
        );
        continue; // Salta este perfil si hay requisitos faltantes
      }

      if (existingProfile) {
        requisites.forEach((requisite) => {
          existingProfile.requisites.add(requisite);
        });
      } else {
        const newProfile = this.profileRepository.create({
          name: profileData.name,
          requisites,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        });
        await this.entityManager.persistAndFlush(newProfile);
        profilesAdded++;
      }
    }

    if (profilesAdded === 0) {
      throw new BadRequestException('No se pudieron agregar perfiles.');
    }

    return profilesAdded;
  }

  /**
   * Updates an existing profile.
   *
   * @param id - The ID of the profile to update.
   * @param updateProfileDto - The data to update the profile.
   * @returns The updated profile.
   * @throws NotFoundException If the profile is not found.
   * @throws BadRequestException If some requisite names are invalid.
   */
  public async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ResultProfileDto> {
    const profile = await this.profileRepository.findOne({ id });

    if (!profile) {
      throw new NotFoundException(`Profile with ID "${id}" not found.`);
    }

    if (updateProfileDto.name) {
      const existingProfile = await this.profileRepository.findOne({
        name: updateProfileDto.name,
      });
      if (existingProfile && existingProfile.id !== id) {
        throw new BadRequestException(
          `A profile with the name "${updateProfileDto.name}" already exists.`,
        );
      }
      profile.name = updateProfileDto.name;
    }

    if (updateProfileDto.isActive !== undefined) {
      profile.isActive = updateProfileDto.isActive;
    }

    if (updateProfileDto.requisitesNames) {
      const foundRequisites = await this.requisiteRepository.find({
        name: { $in: updateProfileDto.requisitesNames },
      });

      if (
        foundRequisites.length !==
        new Set(updateProfileDto.requisitesNames).size
      ) {
        throw new BadRequestException(
          'Some requisites are invalid or duplicates.',
        );
      }

      profile.requisites.set(foundRequisites);
    }

    profile.updatedAt = new Date();

    await this.entityManager.persistAndFlush(profile);

    return plainToInstance(ResultProfileDto, wrap(profile).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }
}
