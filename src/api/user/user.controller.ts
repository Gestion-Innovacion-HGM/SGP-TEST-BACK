import { Roles } from '@common/security/decorator/roles.decorator';
import { AuthGuard } from '@common/security/guard/auth.guard';
import { EntityDTO } from '@mikro-orm/core';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CreateUserDto } from '@api/user/dto/create-user.dto';
import { ResultUserDto } from '@api/user/dto/result-user.dto';
import { UpdateUserDto } from '@api/user/dto/update-user.dto';
import { UserService } from '@api/user/user.service';

import { Role } from '@domain/enums/role.enums';
import { User } from '@domain/user';

@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard)
export class UserController {
  public constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Request() req: any,
    @Body() createUserDto: CreateUserDto,
  ): Promise<EntityDTO<User>> {
    try {
      const creator = req.user;
      const {
        firstName,
        secondName,
        surname,
        secondSurname,
        email,
        birthdate,
        sex,
        idDocument,
        roles,
        address,
        servicesNames,
        profileName,
        hiringName,
        groupName,
        militaryCard,
      } = createUserDto;
      return await this.userService.createUser(
        creator,
        firstName,
        secondName,
        surname,
        secondSurname,
        email,
        birthdate,
        sex,
        idDocument,
        roles,
        address,
        servicesNames,
        profileName,
        hiringName,
        groupName,
        militaryCard,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @Roles(Role.SUPERUSER, Role.MODERATOR, Role.COORDINATOR)
  public async findUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
    @Query('firstName') firstName?: string,
    @Query('secondName') secondName?: string,
    @Query('surname') surname?: string,
    @Query('secondSurname') secondSurname?: string,
    @Query('fullName') fullName?: string,
    @Query('email') email?: string,
    @Query('idNumber') idNumber?: string,
    @Query('id') id?: string,
  ): Promise<{ items: Array<ResultUserDto>; count: number }> {
    return this.userService.findUsers(
      page,
      size,
      firstName,
      secondName,
      surname,
      secondSurname,
      fullName,
      email,
      idNumber,
      id,
    );
  }

  @Patch(':idDocumentNumber/role')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  public async updateUserRole(
    @Request() req: any,
    @Param('idDocumentNumber') idDocumentNumber: string,
    @Body('newRole') newRole: Role,
  ): Promise<ResultUserDto> {
    const currentUser = req.user;
    return this.userService.updateUserRole(
      currentUser,
      idDocumentNumber,
      newRole,
    );
  }

  @Patch(':id')
  @Roles(Role.SUPERUSER, Role.MODERATOR)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<EntityDTO<User>> {
    return this.userService.updateUser(id, updateUserDto);
  }

  /**
   * Endpoint to search for users based on various criteria with pagination.
   * @param page - The page number (default: 1).
   * @param size - The number of items per page (default: 10).
   * @param typeDocument - The type of the document (mandatory).
   * @param numberDocument - The document number (mandatory).
   * @param isActive - The active state of the user (mandatory, default true).
   * @param name - The user's name (optional).
   * @param surname - The user's surname (optional).
   * @param role - The user's role (optional).
   * @param contractType - The type of contract (optional).
   * @param associatedGroup - The associated group (optional).
   * @param associatedService - The associated service (optional).
   * @param startDate - The start date for user creation (optional).
   * @param endDate - The end date for user creation (optional).
   * @returns An array of users matching the search criteria.
   */
  @Get('search')
  async searchUsers(
    @Query('typeDocument') typeDocument: string,
    @Query('numberDocument') numberDocument: string,
    @Query('isActive', new DefaultValuePipe(true), ParseBoolPipe)
    isActive: boolean,
    @Query('name') name?: string,
    @Query('surname') surname?: string,
    @Query('role') role?: Role,
    @Query('contractType') contractType?: string,
    @Query('associatedGroup') associatedGroup?: string,
    @Query('associatedService') associatedService?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('size', new DefaultValuePipe(10), ParseIntPipe) size?: number,
  ): Promise<{ items: User[]; count: number }> {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Las fechas de inicio y fin son obligatorias.',
      );
    }
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    return this.userService.searchUsersWithPagination(
      page,
      size,
      isActive,
      parsedStartDate,
      parsedEndDate,
      typeDocument,
      numberDocument,
      name,
      surname,
      role,
      contractType,
      associatedGroup,
      associatedService,
    );
  }
}
