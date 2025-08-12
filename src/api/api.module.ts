import { AuthGuard } from '@common/security/guard/auth.guard';
import { RolesGuard } from '@common/security/guard/roles.guard';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AttachmentController } from '@api/attachment/attachment.controller';
import { AttachmentService } from '@api/attachment/attachment.service';
import { jwtConstants } from '@api/auth/auth.constants';
import { AuthController } from '@api/auth/auth.controller';
import { AuthService } from '@api/auth/auth.service';
import { DocumentController } from '@api/document/document.controller';
import { DocumentService } from '@api/document/document.service';
import { ExpirationLogService } from '@api/expiration-log/expiration-log.service';
import { FloorController } from '@api/floor/floor.controller';
import { FloorService } from '@api/floor/floor.service';
import { GroupController } from '@api/group/group.controller';
import { GroupService } from '@api/group/group.service';
import { HiringController } from '@api/hiring/hiring.controller';
import { HiringService } from '@api/hiring/hiring.service';
import { MailerService } from '@api/mail-service/mail.service';
import { ProfileController } from '@api/profile/profile.controller';
import { ProfileService } from '@api/profile/profile.service';
import { RequisiteController } from '@api/requisite/requisite.controller';
import { RequisiteService } from '@api/requisite/requisite.service';
import { ScheduledTaskService } from '@api/scheduled-task/scheduled-task.service';
import { ServiceController } from '@api/service/service.controller';
import { ServiceService } from '@api/service/service.service';
import { TowerController } from '@api/tower/tower.controller';
import { TowerService } from '@api/tower/tower.service';
import { UbicationController } from '@api/ubication/ubication.controller';
import { UbicationService } from '@api/ubication/ubication.service';
import { UserController } from '@api/user/user.controller';
import { UserService } from '@api/user/user.service';

import { Attachment } from '@domain/attachment';
import { Document } from '@domain/document';
import { ExpirationLog } from '@domain/expiration-log';
import { Floor } from '@domain/floor';
import { Group } from '@domain/group';
import { Hiring } from '@domain/hiring';
import { Location } from '@domain/location';
import { Profile } from '@domain/profile';
import { Requisite } from '@domain/requisite';
import { Service } from '@domain/service';
import { Tower } from '@domain/tower';
import { Ubication } from '@domain/ubication';
import { User } from '@domain/user';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [
        Attachment,
        Document,
        ExpirationLog,
        Floor,
        Group,
        Hiring,
        Location,
        Profile,
        Requisite,
        Service,
        Tower,
        Ubication,
        User,
      ],
    }),
    ConfigModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '43200s' },
    }),
  ],
  providers: [
    AuthService,
    AttachmentService,
    DocumentService,
    ExpirationLogService,
    FloorService,
    GroupService,
    HiringService,
    MailerService,
    ProfileService,
    RequisiteService,
    ScheduledTaskService,
    ServiceService,
    TowerService,
    UbicationService,
    UserService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [
    AuthController,
    AttachmentController,
    DocumentController,
    FloorController,
    GroupController,
    HiringController,
    UserController,
    ProfileController,
    RequisiteController,
    ServiceController,
    TowerController,
    UbicationController,
    UserController,
  ],
})
export class ApiModule {}
