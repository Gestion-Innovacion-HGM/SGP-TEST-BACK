import { EntityDTO, EntityManager, wrap } from '@mikro-orm/core';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';

import { GroupRepository } from '@infrastructure/repository/group.repository';
import { HiringRepository } from '@infrastructure/repository/hiring.repository';
import { ProfileRepository } from '@infrastructure/repository/profile.repository';
import { RequisiteRepository } from '@infrastructure/repository/requisite.repository';
import { ServiceRepository } from '@infrastructure/repository/service.repository';
import { UbicationRepository } from '@infrastructure/repository/ubication.repository';
import { UserRepository } from '@infrastructure/repository/user.repository';

import { MailerService } from '@api/mail-service/mail.service';
import { CreateAddressDto } from '@api/user/dto/create-address.dto';
import { CreateIdDocumentDto } from '@api/user/dto/create-id-document.dto';
import { CreateMilitaryCardDto } from '@api/user/dto/create-military-card.dto';
import { ResultUserDto } from '@api/user/dto/result-user.dto';
import { UpdateAccountDto } from '@api/user/dto/update-account.dto';
import { UpdateAddressDto } from '@api/user/dto/update-address.dto';
import { UpdateFolderDto } from '@api/user/dto/update-folder.dto';
import { UpdateUserDto } from '@api/user/dto/update-user.dto';

import { Account } from '@domain/account';
import { Address } from '@domain/address';
import { TypeOfRoad } from '@domain/enums/address.enums';
import { Role } from '@domain/enums/role.enums';
import { Folder } from '@domain/folder';
import { User } from '@domain/user';

@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly userRepository: UserRepository,
    private readonly ubicationRepository: UbicationRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly groupRepository: GroupRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly hiringRepository: HiringRepository,
    private readonly requisiteRepository: RequisiteRepository,
    private readonly mailService: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Creates a new user with the specified details.
   *
   * @param creator - The user creating the new user.
   * @param firstName - The first name of the user.
   * @param secondName - The second name of the user (optional).
   * @param surname - The surname of the user.
   * @param secondSurname - The second surname of the user (optional).
   * @param email - The email address of the user.
   * @param birthdate - The birthdate of the user.
   * @param sex - The sex of the user.
   * @param idDocument - The identification document of the user.
   * @param roles - The roles assigned to the user.
   * @param addressDto - The address details of the user.
   * @param servicesNames - The names of the services associated with the user.
   * @param profileName - The name of the profile associated with the user.
   * @param hiringName - The name of the hiring associated with the user.
   * @param groupName - The name of the group associated with the user.
   * @param militaryCard - The military card details of the user (optional).
   * @returns A promise that resolves to the created user.
   *
   * @throws {ForbiddenException} If the creator does not have sufficient permissions.
   * @throws {BadRequestException} If the email is already in use, the document already exists, or there are validation errors.
   * @throws {ServiceUnavailableException} If there is an error sending the email.
   * @throws {BadRequestException} If the state and municipality combination is invalid.
   * @throws {BadRequestException} If the type of road is invalid.
   * @throws {BadRequestException} If the military card is required for
   *
   */

  public async createUser(
    creator: User,
    firstName: string,
    secondName: string | undefined,
    surname: string,
    secondSurname: string | undefined,
    email: string,
    birthdate: string,
    sex: string,
    idDocument: CreateIdDocumentDto,
    roles: Role[],
    addressDto: CreateAddressDto,
    servicesNames: string[],
    profileName: string,
    hiringName: string,
    groupName: string,
    militaryCard?: CreateMilitaryCardDto,
  ): Promise<EntityDTO<User>> {
    try {
      if (!this.canCreateUser(creator, roles)) {
        throw new ForbiddenException(
          'Insufficient permissions to create user with specified roles',
        );
      }

      const existingUser = await this.userRepository.findOne({ email });
      if (existingUser) {
        throw new BadRequestException(
          `El correo electrónico '${email}' ya está en uso.`,
        );
      }
      const existingDocument = await this.userRepository.findOne({
        idDocument: {
          type: idDocument.type,
          number: idDocument.number,
        },
      });
      if (existingDocument) {
        throw new BadRequestException(
          `El documento de identificación con tipo '${idDocument.type}' y número '${idDocument.number}' ya existe.`,
        );
      }
      if (sex === 'Hombre' && !militaryCard) {
        throw new BadRequestException(
          'La libreta militar es obligatoria para los hombres.',
        );
      }
      if (sex !== 'Hombre' && militaryCard) {
        throw new BadRequestException(
          'La libreta militar solo es obligatoria para los hombres.',
        );
      }
      if (!roles.includes(Role.COLLABORATOR)) {
        roles.push(Role.COLLABORATOR);
      }
      const ubication = await this.ubicationRepository.findOne({
        state: addressDto.state,
        municipality: addressDto.municipality,
      });
      if (!ubication) {
        throw new BadRequestException(
          'La combinación de estado y municipio no es válida.',
        );
      }
      if (!Object.values(TypeOfRoad).includes(addressDto.typeOfRoad)) {
        throw new BadRequestException(
          `El tipo de dirección '${addressDto.typeOfRoad}' no es válido.`,
        );
      }
      const address = new Address();
      address.state = ubication.state;
      address.municipality = ubication.municipality;
      address.neighborhood = addressDto.neighborhood;
      address.typeOfRoad = addressDto.typeOfRoad;
      address.firstAddressField = addressDto.firstAddressField ?? '';
      address.secondAddressField = addressDto.secondAddressField ?? '';
      address.thirdAddressField = addressDto.thirdAddressField ?? '';
      address.propertyType = addressDto.propertyType;
      address.namePropertyType = addressDto.namePropertyType ?? '';
      address.blockOrInterior = addressDto.blockOrInterior;
      address.blockOrInteriorName = addressDto.blockOrInteriorName ?? '';
      address.observation = addressDto.observation;

      const password = this.generateStrongPassword();
      const account = new Account();
      await account.setPassword(password);

      const groupEntity = await this.groupRepository.findOne({
        name: groupName,
      });
      if (!groupEntity) {
        throw new BadRequestException(
          `El grupo con el nombre '${groupName}' no existe.`,
        );
      }
      if (servicesNames.length < 1) {
        throw new BadRequestException(
          `El usuario ${firstName} ${surname} debe tener al menos un servicio.`,
        );
      }
      const servicesEntities = await this.serviceRepository.find(
        { name: { $in: servicesNames } },
        { populate: ['*'] },
      );
      if (servicesEntities.length !== new Set(servicesNames).size) {
        throw new BadRequestException('No se permiten servicios duplicados');
      }
      const missingServices = servicesNames.filter(
        (name) => !servicesEntities.some((service) => service.name === name),
      );
      if (missingServices.length > 0) {
        throw new BadRequestException(
          `Los servicios con nombres [${missingServices.join(', ')}] no existen.`,
        );
      }
      const invalidServices = servicesEntities.filter(
        (service) => service.group.name !== groupName,
      );
      if (invalidServices.length > 0) {
        throw new BadRequestException(
          `Los servicios con nombres [${invalidServices.map((s) => s.name).join(', ')}] no pertenecen al grupo seleccionado.`,
        );
      }
      const profileEntities = servicesEntities.map((service) =>
        service.profiles.map((profile) => profile.name),
      );
      const allHaveProfile = profileEntities.every((profileList) =>
        profileList.includes(profileName),
      );
      if (!allHaveProfile) {
        throw new BadRequestException(
          `El perfil con nombre '${profileName}' no es común entre todos los servicios seleccionados.`,
        );
      }
      // Extract requisites from profile, services, and hiring
      const profileEntity = await this.profileRepository.findOne({
        name: profileName,
      });
      if (!profileEntity) {
        throw new BadRequestException(
          `El perfil con id '${profileName}' no existe.`,
        );
      }
      const hiringEntity = await this.hiringRepository.findOne({
        type: hiringName,
      });
      if (!hiringEntity) {
        throw new BadRequestException(
          `La contratación con tipo '${hiringName}' no existe.`,
        );
      }
      const requisitesIds = [
        ...profileEntity.requisites,
        ...hiringEntity.requisites,
        ...servicesEntities.flatMap((service) => service.requisites),
      ].map((req) => req.id);
      // Fetch the complete requisites objects
      const requisites = await this.requisiteRepository.find({
        id: { $in: requisitesIds },
      });
      // Create the folder
      const folder = new Folder();
      folder.scaffold(requisites);

      const newUser = this.userRepository.create({
        firstName,
        secondName,
        surname,
        secondSurname,
        email,
        birthdate,
        sex,
        idDocument,
        militaryCard,
        roles,
        account,
        address,
        folder,
        isActive: true,
      });

      try {
        const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL');

        const mailData = {
          receivers: [{ email: email }],
          subject: 'Credenciales de acceso',
          params: {
            email: email,
            password: password,
          },
          sender: { email: senderEmail },
        };

        const loginLink = `http://localhost:3001/v1/auth/login`;

        const content = `
          <p>Hola,</p>
          <p>Tus credenciales de acceso son:</p>
          <p>Email: ${email}</p>
          <p>Password: ${password}</p>
          <p>Puedes iniciar sesión en el siguiente enlace:</p>
          <a href="${loginLink}">Iniciar Sesión</a>
        `;

        const result = await this.mailService.sendMail({
          mailData,
          content,
        });

        if (!result) {
          throw new ServiceUnavailableException(
            `No fue posible enviar el correo electrónico a "${email}".`,
          );
        }

        console.log('Email sent successfully:', result);
      } catch (error) {
        throw new ServiceUnavailableException(
          `No fue posible enviar el correo electrónico a "${email}".`,
        );
      }

      await this.entityManager.persistAndFlush(newUser);

      return wrap(newUser).toObject();
    } catch (error) {
      throw new BadRequestException(
        `Error al crear el usuario: ${error.message}`,
      );
    }
  }

  /**
   * Checks if the given user has the necessary roles to create a new user.
   * @param creator - The user who wants to create a new user.
   * @param roles - The roles required to create a new user.
   * @returns A boolean indicating whether the user can create a new user or not.
   *
   * @throws ForbiddenException if the creator does not have permission to create this type of user.
   */
  private canCreateUser(creator: User, roles: Role[]): boolean {
    if (roles.includes(Role.SUPERUSER)) {
      return creator.roles.includes(Role.SUPERUSER);
    }
    if (roles.includes(Role.MODERATOR)) {
      return creator.roles.includes(Role.SUPERUSER);
    }
    if (roles.includes(Role.COORDINATOR)) {
      return (
        creator.roles.includes(Role.SUPERUSER) ||
        creator.roles.includes(Role.MODERATOR)
      );
    }
    if (roles.includes(Role.COLLABORATOR)) {
      return (
        creator.roles.includes(Role.SUPERUSER) ||
        creator.roles.includes(Role.MODERATOR) ||
        creator.roles.includes(Role.COORDINATOR)
      );
    }
    return false;
  }

  /**
   * Generates a strong password.
   *
   * @returns The generated password.
   */
  private generateStrongPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';
    let password = '';
    for (let i = 0, n = charset.length; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
  }

  /**
   * Retrieves the roles of a user by user ID.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of roles.
   *
   * @throws NotFoundException Thrown if the user with the specified ID is not found.
   */
  public async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }
    return user.roles;
  }

  /**
   * Retrieves users with pagination and filters.
   *
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param firstName - The first name to filter by (optional).
   * @param secondName - The second name to filter by (optional).
   * @param surname - The surname to filter by (optional).
   * @param secondSurname - The second surname to filter by (optional).
   * @param fullName - The full name to filter by (optional).
   * @param email - The email to filter by (optional).
   * @param idNumber - The ID number to filter by (optional).
   * @returns A promise that resolves to an object containing the user items and the total count.
   *
   * @throws BadRequestException
   * Thrown if the page or size values are invalid.
   */
  public async findUsers(
    page: number = 1,
    size?: number,
    firstName?: string,
    secondName?: string,
    surname?: string,
    secondSurname?: string,
    fullName?: string,
    email?: string,
    idNumber?: string,
    id?: string,
  ): Promise<{ items: Array<ResultUserDto>; count: number }> {
    if (page < 1) {
      throw new BadRequestException('La página debe ser mayor o igual a 1');
    }
    if (size && (size < 1 || size > 50)) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual a 50',
      );
    }

    const offset = (page - 1) * (size ?? 0);
    const where: any = {};

    if (firstName) {
      where.firstName = { $regex: new RegExp(firstName, 'i') };
    }
    if (secondName) {
      where.secondName = { $regex: new RegExp(secondName, 'i') };
    }
    if (surname) {
      where.surname = { $regex: new RegExp(surname, 'i') };
    }
    if (secondSurname) {
      where.secondSurname = { $regex: new RegExp(secondSurname, 'i') };
    }
    if (fullName) {
      where.$or = [
        { firstName: { $regex: new RegExp(fullName, 'i') } },
        { secondName: { $regex: new RegExp(fullName, 'i') } },
        { surname: { $regex: new RegExp(fullName, 'i') } },
        { secondSurname: { $regex: new RegExp(fullName, 'i') } },
      ];
    }
    if (email) {
      where.email = { $regex: new RegExp(email, 'i') };
    }
    if (idNumber) {
      where['idDocument_number'] = { $regex: new RegExp(idNumber, 'i') };
    }
    if (id) {
      where.id = id; // Direct match for unique ID
    }

    const [users, count] = await this.userRepository.findAndCount(where, {
      offset,
      limit: size,
      populate: ['*'],
    });

    const resultUsers = users.map((user) =>
      plainToInstance(ResultUserDto, wrap(user).toObject(), {
        exposeDefaultValues: true,
        excludeExtraneousValues: true,
      }),
    );

    return {
      items: resultUsers,
      count,
    };
  }

  /**
   * Finds a user by their email.
   * @param email - The email of the user to find.
   * @returns A Promise that resolves to the found user, or undefined if not found.
   *
   * @throws NotFoundException if no user is found with the specified email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found.`);
    }
    return user;
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @returns A Promise that resolves to the found user, or null if not found.
   *
   * @throws NotFoundException if the user with the specified ID is not found.
   */
  public async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }
    return user;
  }

  /**
   * Updates the role of a user based on the current user's role.
   *
   * @param currentUser - The user making the request.
   * @param targetUserId - The ID of the user whose role is to be updated.
   * @param newRole - The new role to be assigned.
   * @returns The updated user.
   *
   * @throws ForbiddenException if the current user doesn't have permission to update the target user's role.
   * @throws NotFoundException if the target user is not found.
   */
  public async updateUserRole(
    currentUser: User,
    idDocumentNumber: string,
    newRole: Role,
  ): Promise<ResultUserDto> {
    const targetUser = await this.userRepository.findOne({
      idDocument: { number: idDocumentNumber },
    });

    if (!targetUser) {
      throw new NotFoundException(
        `User with document number '${idDocumentNumber}' not found.`,
      );
    }

    if (newRole === Role.MODERATOR) {
      if (
        !currentUser.roles.includes(Role.SUPERUSER) ||
        ![Role.COORDINATOR, Role.COLLABORATOR].some((role) =>
          targetUser.roles.includes(role),
        )
      ) {
        throw new ForbiddenException(
          'You do not have permission to assign this role.',
        );
      }
    } else if (newRole === Role.COORDINATOR) {
      if (
        !currentUser.roles.includes(Role.SUPERUSER) &&
        !currentUser.roles.includes(Role.MODERATOR) &&
        !targetUser.roles.includes(Role.COLLABORATOR)
      ) {
        throw new ForbiddenException(
          'You do not have permission to assign this role.',
        );
      }
    } else {
      throw new BadRequestException('Invalid role provided.');
    }

    if (!targetUser.roles.includes(Role.COLLABORATOR)) {
      targetUser.roles.push(Role.COLLABORATOR);
    }

    if (!targetUser.roles.includes(newRole)) {
      targetUser.roles.push(newRole);
    }

    await this.entityManager.persistAndFlush(targetUser);

    return plainToInstance(ResultUserDto, targetUser, {
      exposeDefaultValues: true,
      excludeExtraneousValues: true,
    });
  }

  /**
   * Updates a user with the provided data.
   *
   * @param id - The ID of the user to update.
   * @param updateUserDto - The DTO containing the fields to update.
   * @returns A Promise that resolves to the updated user.
   */
  public async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<EntityDTO<User>> {
    const user = await this.userRepository.findOne({ id });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Update the fields of the User entity
    wrap(user).assign(updateUserDto, {
      em: this.entityManager,
    });

    // If the account needs to be updated
    if (updateUserDto.account) {
      const accountDto: UpdateAccountDto = updateUserDto.account;
      wrap(user.account).assign(accountDto);
    }

    // If the address needs to be updated
    if (updateUserDto.address) {
      const addressDto: UpdateAddressDto = updateUserDto.address;
      wrap(user.address).assign(addressDto);
    }

    // If the folder needs to be updated
    if (updateUserDto.folder) {
      const folderDto: UpdateFolderDto = updateUserDto.folder;
      wrap(user.folder).assign(folderDto);
    }

    await this.entityManager.persistAndFlush(user);

    return wrap(user).toObject();
  }

  /**
   * Searches for users based on the provided criteria with pagination.
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param typeDocument - The type of the document (mandatory).
   * @param numberDocument - The document number (mandatory).
   * @param isActive - The user's active state (mandatory, default true).
   * @param name - The user's name (optional).
   * @param surname - The user's surname (optional).
   * @param role - The user's role (optional).
   * @param contractType - The type of contract (optional).
   * @param associatedGroup - The associated group (optional).
   * @param associatedService - The associated service (optional).
   * @param startDate - The start date for user creation (optional).
   * @param endDate - The end date for user creation (optional).
   * @returns An object containing the matched users and the total count.
   */
  public async searchUsersWithPagination(
    page: number = 1,
    size: number = 10,
    isActive: boolean = true,
    startDate: Date,
    endDate: Date,
    typeDocument?: string,
    numberDocument?: string,
    name?: string,
    surname?: string,
    role?: Role,
    contractType?: string,
    associatedGroup?: string,
    associatedService?: string,
  ): Promise<{ items: User[]; count: number }> {
    // Validate mandatory fields
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Las fechas de inicio y fin son obligatorias.',
      );
    }

    if (page < 1) {
      throw new BadRequestException('La página debe ser mayor o igual a 1');
    }

    if (size < 1 || size > 50) {
      throw new BadRequestException(
        'El tamaño de la página debe ser mayor o igual a 1 y menor o igual a 50',
      );
    }

    const offset = (page - 1) * size;

    const where: any = { isActive };

    // Add mandatory date range
    where.createdAt = { $gte: startDate, $lte: endDate };

    // Add optional criteria
    if (typeDocument) {
      where['idDocument.type'] = typeDocument;
    }
    if (numberDocument) {
      where['idDocument.number'] = numberDocument;
    }
    if (name) {
      where.firstName = { $regex: new RegExp(name, 'i') };
    }
    if (surname) {
      where.surname = { $regex: new RegExp(surname, 'i') };
    }
    if (role) {
      where.roles = { $in: [role] };
    }
    if (contractType) {
      where['folder.hiring.type'] = contractType;
    }
    if (associatedGroup) {
      where['folder.services.group.name'] = associatedGroup;
    }
    if (associatedService) {
      where['folder.services.name'] = associatedService;
    }

    // Perform the query with pagination
    const [users, count] = await this.userRepository.findAndCount(where, {
      limit: size,
      offset,
      populate: ['folder.services', 'roles', 'folder.hiring'],
    });

    return { items: users, count };
  }
}
