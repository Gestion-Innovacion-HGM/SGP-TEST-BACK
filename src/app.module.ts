import { TrimInterceptor } from '@/common/interceptors/trim.interceptor.ts/trim.interceptor';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { RepositoryModule } from '@infrastructure/repository/repository.module';

import { ApiModule } from '@api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.local' }),
    RepositoryModule,
    ApiModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TrimInterceptor,
    },
  ],
})
export class AppModule {}
