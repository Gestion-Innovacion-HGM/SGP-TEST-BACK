import { EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as ExcelJS from 'exceljs';

import { FloorRepository } from '@infrastructure/repository/floor.repository';
import { GroupRepository } from '@infrastructure/repository/group.repository';
import { ProfileRepository } from '@infrastructure/repository/profile.repository';
import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';
import { ServiceRepository } from '@infrastructure/repository/service.repository';
import { TowerRepository } from '@infrastructure/repository/tower.repository';

import { ResultServiceDto } from '@api/service/dto/result-service.dto';
import { UpdateServiceDto } from '@api/service/dto/update-service.dto';

import { Category } from '@domain/enums/category.enums';

@Injectable()
export class ServiceService {
  public constructor(
    private readonly entityManager: EntityManager,
    private readonly groupRepository: GroupRepository,
    private readonly floorRepository: FloorRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly requisiteRepository: RequisiteRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly towerRepository: TowerRepository,
  ) {}

  /**
   * Creates a new service.
   *
   * @param name - The name of the service.
   * @param code - The code of the service (optional for non-care categories).
   * @param category - The category of the service.
   * @param costCenter - The cost center of the service.
   * @param qualificationDistinctiveNumber - The qualification distinctive number of the service.
   * @param groupId - The ID of the group associated with the service.
   * @param profileIds - An array of profile IDs associated with the service.
   * @param location - An array of location objects containing floor and tower information.
   * @param requisiteIds - An array of requisite IDs associated with the service.
   * @returns A promise that resolves to the created service entity.
   *
   * @throws BadRequestException
   * Thrown if the category is 'Asistencial' and the code is not provided.
   * Thrown if the service already exists.
   * Thrown if the group does not exist.
   * Thrown if there are no profiles.
   * Thrown if there are no requisites.
   * Thrown if there are no floors or a tower does not exist.
   * Thrown if there are no towers or a tower does not exist.
   */
  public async createService(
    name: string,
    code: number | undefined,
    category: Category,
    costCenter: string,
    qualificationDistinctiveNumber: string,
    groupName: string,
    profilesNames: string[],
    locations: { floor: string; tower: string }[],
    requisitesNames: string[],
    isActive: boolean,
  ): Promise<ResultServiceDto> {
    if (category === Category.CARE && code === undefined) {
      throw new BadRequestException(
        `El campo 'código' es obligatorio para la categoría 'Asistencial'.`,
      );
    }
    const service = await this.serviceRepository.find({ name });
    if (service.length > 0) {
      throw new BadRequestException(`El Servicio  "${name}"  ya existe.`);
    }
    const group = await this.groupRepository.findOne({ name: groupName });
    if (group === null) {
      throw new BadRequestException(`No hay un grupo  "${groupName}".`);
    }
    if (profilesNames.length < 1) {
      throw new BadRequestException(
        `El servicio "${name}" debe tener al menos un perfil.`,
      );
    }
    const profiles = await this.profileRepository.find({
      name: profilesNames,
    });
    if (profiles.length !== new Set(profilesNames).size) {
      throw new BadRequestException('No se permiten perfiles duplicados');
    }
    const missingProfiles = profilesNames.filter(
      (name) => !profiles.some((profile) => profile.name === name),
    );
    if (missingProfiles.length > 0) {
      throw new BadRequestException(
        `Los siguientes perfiles no existen: ${missingProfiles.join(', ')}`,
      );
    }
    if (requisitesNames.length < 1) {
      throw new BadRequestException(
        `El servicio "${name}" debe tener al menos un requisito.`,
      );
    }
    const requisites = await this.requisiteRepository.find({
      name: requisitesNames,
    });
    if (requisites.length !== new Set(requisitesNames).size) {
      throw new BadRequestException('No se permiten requisitos duplicados');
    }
    const missingRequisites = requisitesNames.filter(
      (name) => !requisites.some((requisite) => requisite.name === name),
    );
    if (missingRequisites.length > 0) {
      throw new BadRequestException(
        `Los siguientes requisitos no existen: ${missingRequisites.join(', ')}`,
      );
    }
    const verifyFloors = locations.map(
      async (loc) => await this.floorRepository.findOne({ name: loc.floor }),
    );
    const floors = await Promise.all(verifyFloors);
    if (floors.includes(null)) {
      throw new BadRequestException(
        `No todos los pisos existen en la base de datos.`,
      );
    }
    const verifyTowers = locations.map(
      async (loc) => await this.towerRepository.findOne({ name: loc.tower }),
    );
    const towers = await Promise.all(verifyTowers);
    if (towers.includes(null)) {
      throw new BadRequestException(
        `No todas las torres existen en la base de datos.`,
      );
    }
    const createdService = this.serviceRepository.create({
      name,
      code,
      category: category as Category,
      costCenter,
      group,
      locations,
      qualificationDistinctiveNumber,
      profiles,
      requisites,
      isActive,
    });
    await this.entityManager.persistAndFlush(createdService);
    return plainToInstance(ResultServiceDto, wrap(createdService).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Retrieves all services with pagination and optional filtering by category, name, code, or cost center.
   *
   * @param page - The page number to retrieve (default: 1).
   * @param size - The number of services per page (default: 10).
   * @param category - Optional category to filter by (case-insensitive).
   * @param name - Optional name to filter by (case-insensitive).
   * @param code - Optional code to filter by.
   * @param costCenter - Optional cost center to filter by (case-insensitive).
   * @returns A promise that resolves to an object containing the array of service items and the total count.
   *
   * @throws BadRequestException
   * Thrown if the page or size values are invalid.
   */
  public async findServices(
    page: number = 1,
    size?: number,
    category?: Category,
    name?: string,
    code?: number,
    costCenter?: string,
  ): Promise<{ items: Array<ResultServiceDto>; count: number }> {
    if (page < 1) {
      throw new BadRequestException(
        'El número de página debe ser mayor o igual que 1',
      );
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual que 50',
      );
    }

    const offset = (page - 1) * (size ?? 0);
    const where: any = {};

    if (category) {
      where.category = { $regex: new RegExp(category, 'i') };
    }
    if (name) {
      where.name = { $regex: new RegExp(name, 'i') };
    }
    if (code !== undefined) {
      where.code = code;
    }
    if (costCenter) {
      where.costCenter = { $regex: new RegExp(costCenter, 'i') };
    }

    const [services, count] = await this.serviceRepository.findAndCount(where, {
      offset,
      limit: size,
      populate: ['*'],
    });
    const items = services.map((service) =>
      plainToInstance(ResultServiceDto, wrap(service).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
    return {
      items,
      count,
    };
  }

  /**
   * Loads services from an Excel file and stores them in the database.
   *
   * @param filePath - The path to the Excel file containing the services.
   * @returns A promise that resolves to the number of services added.
   *
   * @throws BadRequestException if the file cannot be read or no valid services are found.
   */
  public async loadServicesFromExcel(filePath: string): Promise<number> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('El archivo Excel no contiene datos.');
    }

    // Obtener todos los grupos de la base de datos
    const allGroups = await this.groupRepository.findAll();
    const groupMap = new Map<string, string>();
    allGroups.forEach((group) => {
      groupMap.set(group.name.toLowerCase().trim(), group.name); // Crear un mapeo por nombre
    });

    const servicesMap = new Map<
      string,
      {
        category: string;
        code?: number;
        costCenter: string;
        qualificationDistinctiveNumber: string;
        group: string;
        profilesNames: Set<string>;
        location?: { floor: string; tower: string };
        requisitesNames: Set<string>;
        isActive: boolean;
      }
    >();

    // Procesar cada fila en la hoja de Excel
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Omitir el encabezado

      const category = row.getCell(1).value?.toString().trim();
      const name = row.getCell(2).value?.toString().trim();
      const code = row.getCell(3).value
        ? parseInt(row.getCell(3).value?.toString() || '')
        : undefined;
      const costCenter = row.getCell(4).value?.toString().trim();
      const qualificationDistinctiveNumber = row
        .getCell(5)
        .value?.toString()
        .trim();
      const groupNameCell = row.getCell(6).value;
      const groupName =
        typeof groupNameCell === 'string'
          ? groupNameCell.trim().toLowerCase()
          : groupNameCell?.toString().trim().toLowerCase() || '';
      const profilesStr = row.getCell(7).value?.toString().trim() || '';
      const towerName = row.getCell(8).value?.toString().trim() || '';
      const floorName = row.getCell(9).value?.toString().trim() || '';
      const requisitesStr = row.getCell(10).value?.toString().trim() || '';
      const isActiveCell = row
        .getCell(11)
        .value?.toString()
        .trim()
        .toLowerCase();

      const isActive = isActiveCell === 'true';

      if (
        !category ||
        !name ||
        !costCenter ||
        !qualificationDistinctiveNumber ||
        !groupName ||
        !isActive
      ) {
        console.error(
          `Fila inválida en el Excel, algunos campos obligatorios están vacíos. Skipping...`,
        );
        return;
      }

      const serviceKey = name; // Usar el nombre del servicio como clave en el mapa

      // Validar si el grupo existe
      const groupId = groupMap.get(groupName);
      if (!groupId) {
        console.error(
          `El grupo "${groupName}" no existe en la base de datos. Skipping...`,
        );
        return; // Saltar filas con grupos no válidos
      }

      // Convertir las cadenas de perfiles y requisitos en arrays
      const profilesNames = profilesStr
        ? profilesStr.split(',').map((name) => name.trim())
        : [];
      const requisitesNames = requisitesStr
        ? requisitesStr.split(',').map((name) => name.trim())
        : [];

      // Crear la ubicación, solo si torre y piso están definidos
      let location = undefined;
      if (towerName && floorName) {
        location = { floor: floorName, tower: towerName };
      }

      // Si el servicio ya existe en el mapa, actualizar sus perfiles y requisitos
      if (servicesMap.has(serviceKey)) {
        const existingService = servicesMap.get(serviceKey)!;
        existingService.requisitesNames = new Set([
          ...existingService.requisitesNames,
          ...requisitesNames,
        ]);
        existingService.profilesNames = new Set([
          ...existingService.profilesNames,
          ...profilesNames,
        ]);

        // Solo establecer la ubicación si aún no se ha establecido una para este servicio
        if (!existingService.location && location) {
          existingService.location = location;
        }
      } else {
        // Si es un nuevo servicio, agregarlo al mapa
        servicesMap.set(serviceKey, {
          category,
          code,
          costCenter,
          qualificationDistinctiveNumber,
          group: groupId, // Usar el ID del grupo mapeado
          profilesNames: new Set(profilesNames),
          location,
          requisitesNames: new Set(requisitesNames),
          isActive,
        });
      }
    });

    let servicesAdded = 0;

    // Crear los servicios a partir del mapa acumulado
    for (const [name, serviceData] of servicesMap) {
      try {
        await this.createService(
          name,
          serviceData.code,
          serviceData.category as Category,
          serviceData.costCenter,
          serviceData.qualificationDistinctiveNumber,
          serviceData.group,
          Array.from(serviceData.profilesNames),
          serviceData.location ? [serviceData.location] : [],
          Array.from(serviceData.requisitesNames),
          serviceData.isActive,
        );
        servicesAdded++;
      } catch (error) {
        console.error(`Error creating service ${name}: ${error.message}`);
      }
    }
    return servicesAdded;
  }

  /**
   * Updates an existing service.
   *
   * @param id - The ID of the service to update.
   * @param updateServiceDto - The data to update the service.
   * @returns A promise that resolves to the updated service.
   *
   * @throws NotFoundException If the service is not found.
   * @throws BadRequestException If any of the related entities (group, profiles, requisites) do not exist.
   */
  public async updateService(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ResultServiceDto> {
    const service = await this.serviceRepository.findOne({ id });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found.`);
    }

    if (updateServiceDto.groupName) {
      const group = await this.groupRepository.findOne({
        name: updateServiceDto.groupName,
      });
      if (!group) {
        throw new BadRequestException(
          `Group "${updateServiceDto.groupName}" not found.`,
        );
      }
      service.group = group;
    }

    if (updateServiceDto.profilesNames) {
      const profiles = await this.profileRepository.find({
        name: updateServiceDto.profilesNames,
      });
      if (profiles.length !== updateServiceDto.profilesNames.length) {
        throw new BadRequestException('Some profiles do not exist.');
      }
      service.profiles = profiles; // Asignación directa al array
    }

    if (updateServiceDto.requisitesNames) {
      const requisites = await this.requisiteRepository.find({
        name: updateServiceDto.requisitesNames,
      });
      if (requisites.length !== updateServiceDto.requisitesNames.length) {
        throw new BadRequestException('Some requisites do not exist.');
      }
      service.requisites = requisites; // Asignación directa al array
    }

    if (updateServiceDto.locations) {
      service.locations = updateServiceDto.locations;
    }

    // Asignar los valores actualizables sin `ignoreUndefined`
    wrap(service).assign(updateServiceDto);

    await this.entityManager.persistAndFlush(service);

    return plainToInstance(ResultServiceDto, wrap(service).toObject(), {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Finds all services associated with a specific group by its name.
   *
   * @param groupName - The name of the group to filter services by.
   * @returns A promise that resolves to an array of ResultServiceDto.
   *
   * @throws NotFoundException if the group with the specified name is not found.
   */
  public async findServicesByGroupName(
    groupName: string,
  ): Promise<ResultServiceDto[]> {
    const group = await this.groupRepository.findOne({ name: groupName });
    if (!group) {
      throw new NotFoundException(`Group with name '${groupName}' not found.`);
    }

    const services = await this.serviceRepository.find(
      { group },
      { populate: ['*'] },
    );

    return services.map((service) =>
      plainToInstance(ResultServiceDto, wrap(service).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );
  }
}
